import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseCard from '../components/ExerciseCard.jsx'
import Icon from '../components/Icon.jsx'
import { SearchIcon } from '../components/icons.jsx'
import Pagination from '../components/Pagination.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaOptions, difficultyOptions } from '../lib/enums.js'
import { toQuery } from '../lib/api.js'
import { plural } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { btn, container, input, pageTitle, select } from '../lib/ui.js'

const PER_PAGE = 9
const AREAS = Object.entries(areaOptions())
const DIFFICULTIES = Object.entries(difficultyOptions())

const header = (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className={pageTitle}>Exercise library</h1>
      <p className="mt-1 text-[15px] text-slate-600">Gentle stretches shared by the JustStretch community.</p>
    </div>
    <Link to="/exercises/new" className={`${btn.primary} ${btn.md}`}>
      <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
      Add exercise
    </Link>
  </div>
)

const chip = (active) =>
  `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors ${
    active ? 'border-accent bg-accent text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
  }`

// Body-area chips. Counts come from the API and ignore the area filter itself,
// so every chip shows how many results picking it would give.
function AreaChips({ current, counts, onPick }) {
  const total = Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0)
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Body area">
      <button type="button" className={chip(current === '')} aria-pressed={current === ''} onClick={() => onPick('')}>
        All
        {counts && <span className="tabular-nums opacity-70">{total}</span>}
      </button>
      {AREAS.map(([value, label]) => (
        <button key={value} type="button" className={chip(current === value)} aria-pressed={current === value} onClick={() => onPick(value)}>
          {label}
          {counts && <span className="tabular-nums opacity-70">{counts[value] ?? 0}</span>}
        </button>
      ))}
    </div>
  )
}

// Search and difficulty. Submitting keeps the area the chips picked.
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
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id="search"
          name="search"
          type="search"
          className={`${input} ps-10`}
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
          <option value="">Any difficulty</option>
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

  // Search, area and difficulty live in the URL so filtered views can be bookmarked.
  const apply = (next) => setParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value.trim() !== '')))
  const pageLink = (target) => `/exercises${toQuery({ ...filters, page: target > 1 ? target : '' })}`

  const exercises = data?.data ?? []
  const total = data?.meta.total ?? 0

  return (
    <AppLayout title="Exercise library" header={header}>
      <div className={`${container} space-y-5 pb-16 pt-6`}>
        {/* Remount when the URL changes so the fields always show the applied filters. */}
        <FilterForm key={params.toString()} filters={filters} onApply={(draft) => apply({ ...draft, area: filters.area })} />
        <AreaChips current={filters.area} counts={data?.meta.areaCounts} onPick={(area) => apply({ ...filters, area })} />

        {loading && (
          <p className="text-sm text-slate-500" role="status">
            Loading exercises…
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700" role="alert">
            Could not load the library: {error.message}
          </p>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                {total} {plural('exercise', total)}{' '}
                {hasFilters ? `${total === 1 ? 'matches' : 'match'} your filters` : 'in the library'}
              </p>
              {hasFilters && (
                <Link to="/exercises" className="text-sm font-bold text-accent hover:text-accent-dark">
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
                hint="Try a different search term or widen the body area and difficulty."
                actionTo="/exercises"
                actionLabel="Clear filters"
                icon={SearchIcon}
              />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {exercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
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
