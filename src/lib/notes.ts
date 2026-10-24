// A run of 7+ digits, optionally with a leading + and spaces, dots or dashes between them.
const PHONE = /\+?\d[\d\s.-]{5,}\d/

/** The first phone number in the text, as written and as dialable digits. */
export function findPhone(text: string) {
  const match = text.match(PHONE)?.[0]
  if (!match || match.replace(/\D/g, '').length < 7) return null
  return { display: match.trim(), tel: match.replace(/[^\d+]/g, '') }
}
