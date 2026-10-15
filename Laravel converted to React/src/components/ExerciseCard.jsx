import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { areaLabel } from '../lib/enums.js'
import DifficultyBadge from './DifficultyBadge.jsx'

export default function ExerciseCard({ exercise, className = '' }) {
  const { user } = useAuth()
  const byYou = exercise.author?.id === user?.id

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-ink/40 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-accent">{areaLabel(exercise.targetArea)}</span>
        <DifficultyBadge difficulty={exercise.difficulty} />
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
        <Link to={`/exercises/${exercise.id}`} className="after:absolute after:inset-0 focus:outline-none">
          {exercise.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm text-muted line-clamp-3">{exercise.description}</p>

      <div className="mt-auto pt-5 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {exercise.durationMinutes} min
        </span>
        <span className="truncate ms-3">by {byYou ? 'you' : exercise.author?.name}</span>
      </div>
    </article>
  )
}
