import { DIFFICULTY_VALUES, difficultyLabel } from '../lib/enums.js'

// Level as a small three-bar meter plus the word, like a signal-strength indicator.
export default function DifficultyBadge({ difficulty, className = '' }) {
  const level = Math.max(1, DIFFICULTY_VALUES.indexOf(difficulty) + 1)
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] text-ink-2 ${className}`}>
      <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-3 w-1 rounded-[1px] ${i < level ? 'bg-ink-2' : 'bg-line'}`} />
        ))}
      </span>
      {difficultyLabel(difficulty)}
    </span>
  )
}
