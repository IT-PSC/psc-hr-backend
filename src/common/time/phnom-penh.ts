/** Business calendar helpers — Asia/Phnom_Penh */
const TZ = 'Asia/Phnom_Penh';

export function nowPhnomPenh(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: TZ }),
  );
}

export function todayYmdPhnomPenh(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatTimePhnomPenh(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

export { TZ as PHNOM_PENH_TZ };
