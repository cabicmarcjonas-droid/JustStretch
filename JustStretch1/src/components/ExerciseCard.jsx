import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { areaLabel } from '../lib/enums.js'
import { card } from '../lib/ui.js'
import DifficultyBadge from './DifficultyBadge.jsx'
import Thumbnail from './Thumbnail.jsx'

export default function ExerciseCard({ exercise, className = '' }) {
  const { user } = useAuth()
  const byYou = exercise.author?.id === user?.id

  return (
    <article
      className={`group relative flex flex-col overflow-hidden ${card} transition-[transform,box-shadow] duration-200 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-lg ${className}`}
    >
      <Thumbnail videoUrl={exercise.videoUrl} label className="aspect-video">
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-accent shadow-sm">
          {areaLabel(exercise.targetArea)}
        </span>
      </Thumbnail>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-lg font-bold leading-snug">
          <Link to={`/exercises/${exercise.id}`} className="after:absolute after:inset-0 focus:outline-none">
            {exercise.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{exercise.description}</p>

        <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted">
          <DifficultyBadge difficulty={exercise.difficulty} />
          <span className="font-medium">· {exercise.durationMinutes} min</span>
          <span className="ms-auto truncate">by {byYou ? 'you' : exercise.author?.name}</span>
        </div>
      </div>
    </article>
  )
}
