/** "Saturday 24 October" */
export function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
