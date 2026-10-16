// Dates are shown in Asia/Manila, the same timezone the Laravel app and the
// dashboard's weekly stats use.
const TZ = 'Asia/Manila'

const fmt = (options) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...options })

const long = fmt({ weekday: 'long', month: 'long', day: 'numeric' })
const short = fmt({ month: 'short', day: 'numeric', year: 'numeric' })
const time = fmt({ hour: 'numeric', minute: '2-digit', hour12: true })

// "Thursday, October 15"
export const formatDateLong = (date) => long.format(new Date(date))
// "Oct 15, 2026"
export const formatDate = (date) => short.format(new Date(date))
// "2:41 PM"
export const formatTime = (date) => time.format(new Date(date))

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' })
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

// Like Carbon's diffForHumans(): "2 hours ago", "1 day ago".
export function timeAgo(date, now = Date.now()) {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  const [unit, size] = UNITS.find(([, s]) => abs >= s) ?? ['second', 1]
  return rtf.format(Math.trunc(seconds / size), unit)
}

export const firstName = (name) => String(name ?? '').split(' ')[0]

export const plural = (word, count) => (count === 1 ? word : `${word}s`)
