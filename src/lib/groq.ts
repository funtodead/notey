const API = 'https://api.groq.com/openai/v1'
const FILING_MODEL = 'openai/gpt-oss-120b'
const SPEECH_MODEL = 'whisper-large-v3-turbo'

/** One thing the AI pulled out of a message. */
export interface FiledEntry {
  type: 'task' | 'event' | 'note' | 'list_item'
  title: string
  category: string
  date: string | null
  end_date: string | null
  time: string | null
  list: string | null
  list_emoji: string | null
}

export interface FilingContext {
  /** YYYY-MM-DD */
  today: string
  categories: { id: string; name: string }[]
  lists: string[]
}

export class GroqError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request(apiKey: string, path: string, body: BodyInit, json: boolean) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, ...(json && { 'Content-Type': 'application/json' }) },
    body,
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new GroqError(response.status, detail?.error?.message ?? response.statusText)
  }
  return response.json()
}

export async function transcribe(apiKey: string, audio: Blob): Promise<string> {
  const form = new FormData()
  // iPhones record AAC in an mp4 container; Groq picks the decoder from the file name.
  form.append('file', audio, audio.type.includes('mp4') ? 'speech.m4a' : 'speech.webm')
  form.append('model', SPEECH_MODEL)
  const result = await request(apiKey, '/audio/transcriptions', form, false)
  return result.text.trim()
}

export async function fileText(apiKey: string, text: string, context: FilingContext): Promise<FiledEntry[]> {
  const nullable = (type: string) => ({ type: [type, 'null'] })
  const schema = {
    type: 'object',
    properties: {
      entries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['task', 'event', 'note', 'list_item'] },
            title: { type: 'string' },
            category: { type: 'string', enum: context.categories.map((c) => c.id) },
            date: nullable('string'),
            end_date: nullable('string'),
            time: nullable('string'),
            list: nullable('string'),
            list_emoji: nullable('string'),
          },
          required: ['type', 'title', 'category', 'date', 'end_date', 'time', 'list', 'list_emoji'],
          additionalProperties: false,
        },
      },
    },
    required: ['entries'],
    additionalProperties: false,
  }

  const result = await request(
    apiKey,
    '/chat/completions',
    JSON.stringify({
      model: FILING_MODEL,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: filingPrompt(context) },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'filing', strict: true, schema } },
    }),
    true,
  )
  return JSON.parse(result.choices[0].message.content).entries
}

function filingPrompt({ today, categories, lists }: FilingContext) {
  const weekday = new Date(`${today}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })
  return `You file quick messages for Notey, a personal organizer. Today is ${weekday} ${today}.

Split the message into separate things, in the order mentioned, and file each as one entry:
- "event": an appointment, meeting, occasion or trip, usually with a time. Multi-day things (a trip Thu–Sat) are one event with date and end_date.
- "task": something to do. If no day is mentioned, use today.
- "list_item": something to buy, pack or collect. Put it in "list". Things to buy go to the "Shopping" list unless another list fits better.
- "note": information to remember with no action or day: ideas, phone numbers, recommendations.

Rules:
- Dates are YYYY-MM-DD, resolved from today (e.g. "Tuesday" = the next Tuesday). Times are 24h HH:mm. Use null when not given.
- Notes and list items have date, end_date and time null.
- Titles are short and capitalized, without the date or time words, in the user's language. Keep phone numbers and names exactly.
- category is the id of the best fit: ${categories.map((c) => `${c.id} (${c.name})`).join(', ')}.
- Existing lists: ${lists.length ? lists.join(', ') : 'none'}. Reuse an existing list name exactly when it fits.
- list_emoji: one emoji for a list that doesn't exist yet, otherwise null.`
}
