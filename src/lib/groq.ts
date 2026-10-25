const API = 'https://api.groq.com/openai/v1'
const FILING_MODEL = 'openai/gpt-oss-120b'
const SPEECH_MODEL = 'whisper-large-v3-turbo'

/** One thing the AI pulled out of a message. */
export interface FiledEntry {
  type: 'task' | 'event' | 'note' | 'list_item'
  title: string
  /** A note's extra details, or a list item's quantity. */
  details: string | null
  category: string
  date: string | null
  end_date: string | null
  time: string | null
  list: string | null
  list_emoji: string | null
  repeat: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  repeat_interval: number | null
  repeat_until: string | null
}

/** Something existing the user asked to delete; `date` deletes one day of a repeating item. */
export interface Deletion {
  ref: string
  date: string | null
}

/** A change to something existing; null fields stay as they are. */
export interface Update {
  ref: string
  /** For a repeating item: the one day `done` applies to. */
  occurrence: string | null
  title: string | null
  date: string | null
  time: string | null
  category: string | null
  done: boolean | null
  /** A note's details or a list item's quantity. */
  details: string | null
}

export interface FilingContext {
  /** YYYY-MM-DD */
  today: string
  categories: { id: string; name: string }[]
  lists: string[]
  /** One line per existing thing the user might refer to, each starting with its ref. */
  existing: string[]
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

export async function fileText(
  apiKey: string,
  text: string,
  context: FilingContext,
): Promise<{ entries: FiledEntry[]; deletions: Deletion[]; updates: Update[] }> {
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
            details: nullable('string'),
            category: { type: 'string', enum: context.categories.map((c) => c.id) },
            date: nullable('string'),
            end_date: nullable('string'),
            time: nullable('string'),
            list: nullable('string'),
            list_emoji: nullable('string'),
            repeat: { type: ['string', 'null'], enum: ['daily', 'weekly', 'monthly', 'yearly', null] },
            repeat_interval: nullable('integer'),
            repeat_until: nullable('string'),
          },
          required: [
            'type',
            'title',
            'details',
            'category',
            'date',
            'end_date',
            'time',
            'list',
            'list_emoji',
            'repeat',
            'repeat_interval',
            'repeat_until',
          ],
          additionalProperties: false,
        },
      },
      deletions: {
        type: 'array',
        items: {
          type: 'object',
          properties: { ref: { type: 'string' }, date: nullable('string') },
          required: ['ref', 'date'],
          additionalProperties: false,
        },
      },
      updates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ref: { type: 'string' },
            occurrence: nullable('string'),
            title: nullable('string'),
            date: nullable('string'),
            time: nullable('string'),
            category: { type: ['string', 'null'], enum: [...context.categories.map((c) => c.id), null] },
            done: nullable('boolean'),
            details: nullable('string'),
          },
          required: ['ref', 'occurrence', 'title', 'date', 'time', 'category', 'done', 'details'],
          additionalProperties: false,
        },
      },
    },
    required: ['entries', 'deletions', 'updates'],
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
  return JSON.parse(result.choices[0].message.content)
}

function filingPrompt({ today, categories, lists, existing }: FilingContext) {
  const weekday = new Date(`${today}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })
  return `You file quick messages for Notey, a personal organizer. Today is ${weekday} ${today}.

Split the message into separate things, in the order mentioned, and file each as one entry:
- "event" (shown on the calendar): something that happens on a day or at a time — appointment, meeting, class, birthday, trip. Multi-day things (a trip Thu–Sat) are one event with date and end_date.
- "task" (shown on its day): something the user has to do. If no day is mentioned, use today.
- "list_item" (shown in a list): one thing to buy, pack, read, watch, try or collect. Several things = several entries ("milk, eggs and bread" = 3 list items). Put the list's name in "list".
- "note": information to remember with no action and no day — a single idea, phone number, password, recommendation or fact.

Lists:
- Existing lists: ${lists.length ? lists.join(', ') : 'none'}. Reuse one when it fits by meaning ("groceries" → Shopping), with its exact name.
- Otherwise start a new list with a short, natural name and a fitting list_emoji, e.g. things to buy → "Shopping" 🛒, packing → "Trip packing" 🧳, books → "Books to read" 📚, films and series → "To watch" 🎬, gift ideas → "Gift ideas" 🎁, places → "Places to visit" 📍.
- When the user names things to get, pack, read or watch, prefer list items over tasks. A to-do with a day ("go shopping today") stays a task.

Examples:
- "dentist tuesday at 3" → event on the next Tuesday at 15:00
- "call mom tomorrow" → task tomorrow
- "buy milk and 12 eggs" → list items "Milk" and "Eggs" (details "12") in Shopping
- "books to read: Dune and Atomic Habits" → 2 list items in "Books to read"
- "pack sunscreen and a charger for Eilat" → 2 list items in "Trip packing"
- "gift idea: photo book" → note
- "plumber Marco 06 12 34 56 78" → note "Plumber Marco", details "06 12 34 56 78"
- "gym every Monday at 7" → event "Gym", repeat weekly, interval 1, date = the next Monday, time 07:00
- "pay rent on the 1st of every month" → task "Pay rent", repeat monthly, date = the next 1st
- "water the plants every other day" → task, repeat daily, interval 2, date = today

Repeating:
- Only tasks and events repeat. Set repeat (daily, weekly, monthly, yearly) and repeat_interval (1 = every, 2 = every other, 3 = every third…), with date = the first occurrence, today or later.
- repeat_until is the last date when an end is given ("until December" → the last day of December), else null.
- Things that happen once have repeat, repeat_interval and repeat_until null.

Rules:
- Dates are YYYY-MM-DD, resolved from today (e.g. "Tuesday" = the next Tuesday). Times are 24h HH:mm. Use null when not given.
- Notes and list items have date, end_date and time null.
- Titles are short and capitalized, without the date or time words, in the user's language.
- details: for a note, anything beyond the title (who recommended it, phone numbers, passwords), kept exactly as said; for a list item, the quantity if given ("2 L", "12"); otherwise null.
- category is the id of the best fit: ${categories.map((c) => `${c.id} (${c.name})`).join(', ')}.
- list_emoji: one emoji for a list that doesn't exist yet, otherwise null.

Deleting:
- When the user asks to delete, remove, cancel, cross off or forget something that already exists, put it in "deletions" with its ref from the list below, and don't create an entry for it.
- For one day of a repeating item ("skip gym next Monday", "no yoga today"), give that day's date; to delete the whole thing, date is null.
- Deleting a list deletes everything on it. Only use refs from the list; if nothing matches, delete nothing.

Changing:
- When the user asks to change something that already exists — mark it done or not done, rename it, move it to another day or time, change its category, change a note's details or a list item's quantity — put it in "updates" with its ref and only the fields that change; every other field is null. Don't also create or delete it.
- For one day of a repeating item ("gym is done for today"), set occurrence to that day and done. A new date or time on a repeating item moves the whole series.
- Renaming a list: give the list's ref and the new name as title.
- Examples: "mark gym as done" → done true; "move the dentist to Friday at 4" → date = Friday, time 16:00; "the plumber note goes under Home" → category home; "make it 2 liters of milk" → details "2 L".

Existing things:
${existing.length ? existing.join('\n') : 'none'}`
}
