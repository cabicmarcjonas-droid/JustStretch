import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { areaLabel } from '../lib/enums.js'
import { card, statLabel, tag } from '../lib/ui.js'
import DifficultyBadge from './DifficultyBadge.jsx'
import Thumbnail from './Thumbnail.jsx'

export default function ExerciseCard({ exercise, recommended = false, className = '' }) {
  const { user } = useAuth()
  const byYou = exercise.author?.id === user?.id

  return (
    <article className={`group relative flex flex-col overflow-hidden ${card} transition-colors hover:border-line-strong ${className}`}>
      <Thumbnail videoUrl={exercise.videoUrl} label className="aspect-video border-b border-line" />

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <p className={statLabel}>{areaLabel(exercise.targetArea)}</p>
        <h3 className="mt-1 text-base font-semibold leading-snug">
          <Link to={`/exercises/${exercise.id}`} className="after:absolute after:inset-0 focus:outline-none group-hover:text-accent">
            {exercise.title}
          </Link>
        </h3>
        {recommended && <p className={`mt-2 w-fit ${tag.ok}`}>Matches your body map</p>}
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{exercise.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted">
          <DifficultyBadge difficulty={exercise.difficulty} />
          <span>
            <span className="font-mono">{exercise.durationMinutes}</span> min
          </span>
          <span className="ms-auto truncate">by {byYou ? 'you' : exercise.author?.name}</span>
        </div>
      </div>
    </article>
  )
}
