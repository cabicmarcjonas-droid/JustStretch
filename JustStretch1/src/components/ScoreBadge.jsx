export default function ScoreBadge({ score, className = '' }) {
  const tone = score >= 80 ? 'bg-accent text-white' : score >= 50 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex min-w-11 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${tone} ${className}`}
    >
      {score}
    </span>
  )
}
