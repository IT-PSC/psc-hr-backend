/** Calendar date in Asia/Phnom_Penh as YYYY-MM-DD. */
export function todayInPhnomPenh(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function dateKeyInPhnomPenh(value: Date): string {
  return todayInPhnomPenh(value);
}

/** Whole days from `from` to `to` (YYYY-MM-DD). Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}
