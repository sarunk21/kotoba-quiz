/**
 * Returns a YYYY-MM-DD string representing the local date of the given Date object (defaults to now).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns a YYYY-MM-DD string representing the local date of the given Date object after adding/subtracting days.
 */
export function addLocalDateDays(days: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate)
  d.setDate(d.getDate() + days)
  return getLocalDateString(d)
}

/**
 * Safely parses a local YYYY-MM-DD string into a local Date object (at midnight/00:00:00 local time).
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}
