import { difficultyBadgeClasses, difficultyLabel } from '../lib/enums.js'

export default function DifficultyBadge({ difficulty, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${difficultyBadgeClasses(difficulty)} ${className}`}
    >
      {difficultyLabel(difficulty)}
    </span>
  )
}
