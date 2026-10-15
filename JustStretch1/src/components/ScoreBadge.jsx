export default function ScoreBadge({ score, className = '' }) {
  const tone =
    score >= 80
      ? 'bg-accent text-white border-accent'
      : score >= 50
        ? 'bg-amber-100 text-amber-900 border-amber-200'
        : 'bg-paper text-muted border-line'

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[3rem] rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${tone} ${className}`}
    >
      {score}
    </span>
  )
}
