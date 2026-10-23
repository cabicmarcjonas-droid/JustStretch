import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseCard from '../components/ExerciseCard.jsx'
import Icon from '../components/Icon.jsx'
import { SearchIcon } from '../components/icons.jsx'
import Pagination from '../components/Pagination.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, areaOptions, difficultyOptions } from '../lib/enums.js'
import { toQuery } from '../lib/api.js'
import { plural } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { thumbnailFor } from '../lib/media.js'
import { btn, card, input, pageTitle, select, statLabel, tag } from '../lib/ui.js'

const PER_PAGE = 9
const AREAS = Object.entries(areaOptions())
const DIFFICULTIES = Object.entries(difficultyOptions())

const header = (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className={pageTitle}>Exercise library</h1>
      <p className="mt-1 text-[15px] text-ink-2">Gentle stretches shared by the JustStretch community.</p>
    </div>
    <Link to="/exercises/new" className={`${btn.primary} ${btn.md}`}>
      <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
      Add exercise
    </Link>
  </div>
)

// Stretches with a bundled reference video are scored from the camera; the rest are self-rated.
const isLiveScored = (exercise) => thumbnailFor(exercise.videoUrl) != null

// Body-area segments. Counts come from the API and ignore the area filter itself,
// so every segment shows how many results picking it would give.
function AreaBar({ current, counts, onPick }) {
  const total = Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0)
  const segment = (active) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 border-r border-line px-3.5 text-sm font-medium transition-colors last:border-r-0 ${
      active ? 'bg-ink text-white' : 'bg-surface text-ink-2 hover:bg-paper-2'
    }`
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex overflow-hidden rounded-md border border-line" role="group" aria-label="Body area">
        <button type="button" className={segment(current === '')} aria-pressed={current === ''} onClick={() => onPick('')}>
          All
          {counts && <span className="font-mono text-xs opacity-70">{total}</span>}
        </button>
        {AREAS.map(([value, label]) => (
          <button key={value} type="button" className={segment(current === value)} aria-pressed={current === value} onClick={() => onPick(value)}>
            {label}
            {counts && <span className="font-mono text-xs opacity-70">{counts[value] ?? 0}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// Search and difficulty. Submitting keeps the area the segments picked.
function FilterForm({ filters, onApply }) {
  const [draft, setDraft] = useState(filters)
  const set = (name) => (event) => setDraft((current) => ({ ...current, [name]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" role="search">
      <div className="relative flex-1">
        <label htmlFor="search" className="sr-only">
          Search by title
        </label>
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id="search"
          name="search"
          type="search"
          className={`${input} ps-9`}
          placeholder="Search by title…"
          value={draft.search}
          onChange={set('search')}
        />
      </div>
      <div className="sm:w-48">
        <label htmlFor="difficulty" className="sr-only">
          Difficulty
        </label>
        <select
          id="difficulty"
          name="difficulty"
          className={select}
          value={draft.difficulty}
          onChange={(event) => onApply({ ...draft, difficulty: event.target.value })}
        >
          <option value="">Any level</option>
          {DIFFICULTIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={`${btn.dark} h-11 px-5 text-sm`}>
        Search
      </button>
    </form>
  )
}

function ExerciseTable({ exercises, isRecommended, userId }) {
  const th = `${statLabel} px-3 py-2.5 text-left font-medium`
  return (
    <div className={`${card} hidden overflow-hidden md:block`}>
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-paper-2">
          <tr>
            <th className={`${th} ps-4`}>Exercise</th>
            <th className={th}>Area</th>
            <th className={th}>Level</th>
            <th className={`${th} text-right`}>Time</th>
            <th className={th}>Feedback</th>
            <th className={`${th} pe-4`}>Added by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {exercises.map((exercise) => (
            <tr key={exercise.id} className="group relative transition-colors hover:bg-paper">
              <td className="py-3 ps-4 pe-3">
                <div className="flex items-center gap-3">
                  <Thumbnail videoUrl={exercise.videoUrl} className="h-12 w-[72px] shrink-0 rounded-md" />
                  <div className="min-w-0">
                    <Link
                      to={`/exercises/${exercise.id}`}
                      className="font-medium after:absolute after:inset-0 focus:outline-none group-hover:text-accent"
                    >
                      {exercise.title}
                    </Link>
                    <p className="line-clamp-1 max-w-md text-[13px] text-muted">{exercise.description}</p>
                    {isRecommended(exercise) && <p className={`mt-1 w-fit ${tag.ok}`}>Matches your body map</p>}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-ink-2">{areaLabel(exercise.targetArea)}</td>
              <td className="px-3 py-3">
                <DifficultyBadge difficulty={exercise.difficulty} />
              </td>
              <td className="px-3 py-3 text-right text-ink-2">
                <span className="font-mono">{exercise.durationMinutes}</span> min
              </td>
              <td className="px-3 py-3">
                {isLiveScored(exercise) ? <span className={tag.ok}>Live score</span> : <span className={tag.neutral}>Self-rated</span>}
              </td>
              <td className="max-w-40 truncate py-3 ps-3 pe-4 text-ink-2">{exercise.author?.id === userId ? 'You' : exercise.author?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExercisesIndex() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const filters = {
    search: (params.get('search') ?? '').trim(),
    area: params.get('area') ?? '',
    difficulty: params.get('difficulty') ?? '',
  }
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)
  const hasFilters = Object.values(filters).some(Boolean)

  const { data, error, loading } = useFetch(`/exercises${toQuery({ ...filters, page: page > 1 ? page : '' })}`)

  // Search, area and difficulty live in the URL so filtered views can be bookmarked.
  const apply = (next) => setParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value.trim() !== '')))
  const pageLink = (target) => `/exercises${toQuery({ ...filters, page: target > 1 ? target : '' })}`

  // The stretches that match the areas the member marked on their body map go
  // first. Members without a body map keep the usual order.
  const painAreas = user?.painAreas ?? []
  const isRecommended = (exercise) => painAreas.includes(exercise.targetArea)
  const exercises = [...(data?.data ?? [])].sort((a, b) => Number(isRecommended(b)) - Number(isRecommended(a)))
  const total = data?.meta.total ?? 0

  return (
    <AppLayout title="Exercise library" header={header}>
      <div className="space-y-4 pb-10">
        {/* Remount when the URL changes so the fields always show the applied filters. */}
        <FilterForm key={params.toString()} filters={filters} onApply={(draft) => apply({ ...draft, area: filters.area })} />
        <AreaBar current={filters.area} counts={data?.meta.areaCounts} onPick={(area) => apply({ ...filters, area })} />

        {loading && (
          <p className="text-sm text-muted" role="status">
            Loading exercises…
          </p>
        )}
        {error && (
          <p className="text-sm text-danger" role="alert">
            Could not load the library: {error.message}
          </p>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className={statLabel}>
                {total} {plural('exercise', total)} {hasFilters ? `${total === 1 ? 'matches' : 'match'} your filters` : 'in the library'}
              </p>
              {hasFilters && (
                <Link to="/exercises" className="text-sm font-medium text-accent hover:text-accent-dark">
                  Clear filters
                </Link>
              )}
            </div>

            {exercises.length === 0 && !hasFilters ? (
              <EmptyState
                message="The library is empty"
                hint="Be the first to share a stretch that helps you."
                actionTo="/exercises/new"
                actionLabel="Add exercise"
              />
            ) : exercises.length === 0 ? (
              <EmptyState
                message="No exercises match your filters"
                hint="Try a different search term or widen the body area and level."
                actionTo="/exercises"
                actionLabel="Clear filters"
                icon={SearchIcon}
              />
            ) : (
              <>
                <ExerciseTable exercises={exercises} isRecommended={isRecommended} userId={user?.id} />
                <div className="grid gap-4 sm:grid-cols-2 md:hidden">
                  {exercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} recommended={isRecommended(exercise)} />
                  ))}
                </div>
                <Pagination meta={data.meta} perPage={PER_PAGE} to={pageLink} noun="exercises" />
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
