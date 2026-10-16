import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseCard from '../components/ExerciseCard.jsx'
import { SELECT_CLASSES, TextInput } from '../components/forms.jsx'
import { SearchIcon } from '../components/icons.jsx'
import Pagination from '../components/Pagination.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaOptions, difficultyOptions } from '../lib/enums.js'
import { toQuery } from '../lib/api.js'
import { plural } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'

const PER_PAGE = 9
const AREAS = Object.entries(areaOptions())
const DIFFICULTIES = Object.entries(difficultyOptions())

const header = (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter">Exercise library</h1>
      <p className="mt-1 text-sm text-muted">Gentle stretches shared by the Just Stretch community.</p>
    </div>
    <Link
      to="/exercises/new"
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-dark"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
      Add exercise
    </Link>
  </div>
)

// Search, area and difficulty live in the URL query string, so filtered views can be
// bookmarked and the back button works.
function FilterForm({ filters, hasFilters, onApply }) {
  const [draft, setDraft] = useState(filters)
  const set = (name) => (event) => setDraft((current) => ({ ...current, [name]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line bg-white p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto]"
      role="search"
    >
      <div>
        <label htmlFor="search" className="sr-only">
          Search by title
        </label>
        <TextInput id="search" name="search" type="search" className="w-full" placeholder="Search by title…" value={draft.search} onChange={set('search')} />
      </div>
      <div>
        <label htmlFor="area" className="sr-only">
          Body area
        </label>
        <select id="area" name="area" className={`w-full ${SELECT_CLASSES}`} value={draft.area} onChange={set('area')}>
          <option value="">All body areas</option>
          {AREAS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="difficulty" className="sr-only">
          Difficulty
        </label>
        <select id="difficulty" name="difficulty" className={`w-full ${SELECT_CLASSES}`} value={draft.difficulty} onChange={set('difficulty')}>
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex flex-1 lg:flex-none items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-bold hover:bg-ink/85"
        >
          Filter
        </button>
        {hasFilters && (
          <Link to="/exercises" className="text-sm text-muted hover:text-ink whitespace-nowrap">
            Clear
          </Link>
        )}
      </div>
    </form>
  )
}

export default function ExercisesIndex() {
  const [params, setParams] = useSearchParams()
  const filters = {
    search: (params.get('search') ?? '').trim(),
    area: params.get('area') ?? '',
    difficulty: params.get('difficulty') ?? '',
  }
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)
  const hasFilters = Object.values(filters).some(Boolean)

  const { data, error, loading } = useFetch(`/exercises${toQuery({ ...filters, page: page > 1 ? page : '' })}`)

  const apply = (draft) => setParams(Object.fromEntries(Object.entries(draft).filter(([, value]) => value.trim() !== '')))
  const pageLink = (target) => `/exercises${toQuery({ ...filters, page: target > 1 ? target : '' })}`

  const exercises = data?.data ?? []
  const total = data?.meta.total ?? 0

  return (
    <AppLayout title="Exercise library" header={header}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Remount when the URL changes so the fields always show the applied filters. */}
        <FilterForm key={params.toString()} filters={filters} hasFilters={hasFilters} onApply={apply} />

        {loading && (
          <p className="mt-6 text-sm text-muted" role="status">
            Loading exercises…
          </p>
        )}
        {error && (
          <p className="mt-6 text-sm text-red-700" role="alert">
            Could not load the library: {error.message}
          </p>
        )}

        {data && (
          <>
            <p className="mt-6 text-sm text-muted">
              {total} {plural('exercise', total)}{' '}
              {hasFilters ? `${total === 1 ? 'matches' : 'match'} your filters` : 'in the library'}
            </p>

            {exercises.length === 0 && !hasFilters ? (
              <EmptyState
                className="mt-4"
                message="The library is empty"
                hint="Be the first to share a stretch that helps you."
                actionTo="/exercises/new"
                actionLabel="Add exercise"
              />
            ) : exercises.length === 0 ? (
              <EmptyState
                className="mt-4"
                message="No exercises match your filters"
                hint="Try a different search term or widen the body area and difficulty."
                actionTo="/exercises"
                actionLabel="Clear filters"
                icon={SearchIcon}
              />
            ) : (
              <>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {exercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                  ))}
                </div>

                <div className="mt-8">
                  <Pagination meta={data.meta} perPage={PER_PAGE} to={pageLink} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
