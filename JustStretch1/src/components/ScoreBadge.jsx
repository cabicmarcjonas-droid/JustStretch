import { scoreTone, scoreWord, tag } from '../lib/ui.js'

// Score in mono plus a status tag: In range (80+), Fair (50-79), Low (below 50).
export default function ScoreBadge({ score, className = '', withWord = true }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-mono text-sm font-medium tabular-nums text-ink">{score}</span>
      {withWord && <span className={tag[scoreTone(score)]}>{scoreWord(score)}</span>}
    </span>
  )
}
