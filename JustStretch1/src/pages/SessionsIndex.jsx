import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { SELECT_CLASSES } from '../components/forms.jsx'
import Pagination from '../components/Pagination.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api, toQuery } from '../lib/api.js'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { emit } from '../lib/eventBus.js'
import { formatDate, formatTime } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'

const PER_PAGE = 15

const header = (
  <>
    <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter">My sessions</h1>
    <p className="mt-1 text-sm text-muted">Every stretch you&apos;ve completed, newest first. Only you can see this list.</p>
  </>
)

function DeleteButton({ onDelete }) {
  return (
    <button type="button" onClick={onDelete} className="text-xs font-medium text-red-700 hover:text-red-900">
      Delete
    </button>
  )
}

export default function SessionsIndex() {
  const [params, setParams] = useSearchParams()
  const exerciseId = params.get('exercise') ?? ''
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)
  const [draft, setDraft] = useState(exerciseId)

  const { data, error, loading, reload } = useFetch(`/sessions${toQuery({ exercise: exerciseId, page: page > 1 ? page : '' })}`)

  const apply = (event) => {
    event.preventDefault()
    setParams(draft ? { exercise: draft } : {})
  }

  const remove = async (session) => {
    if (!window.confirm('Remove this session from your history?')) return
    try {
      const { message } = await api.delete(`/sessions/${session.id}`)
      emit('flash', message)
      // Removing the last row of a later page would leave an empty page; step back one.
      if (data.data.length === 1 && page > 1) {
        setParams(exerciseId ? { exercise: exerciseId, ...(page > 2 ? { page: page - 1 } : {}) } : page > 2 ? { page: page - 1 } : {})
      } else {
        reload()
      }
    } catch (err) {
      emit('flash', err.message)
    }
  }

  const pageLink = (target) => `/sessions${toQuery({ exercise: exerciseId, page: target > 1 ? target : '' })}`

  const sessions = data?.data ?? []

  return (
    <AppLayout title="My sessions" header={header}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <p className="text-sm text-muted" role="status">
            Loading sessions…
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700" role="alert">
            Could not load your sessions: {error.message}
          </p>
        )}

        {data && (
          <>
            {data.exercises.length > 0 && (
              <form onSubmit={apply} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor="exercise" className="text-sm font-medium">
                  Show
                </label>
                <select
                  id="exercise"
                  name="exercise"
                  className={`${SELECT_CLASSES} sm:w-72`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                >
                  <option value="">All exercises</option>
                  {data.exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.title}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-bold hover:bg-ink/85"
                >
                  Apply
                </button>
                {exerciseId && (
                  <Link
                    to="/sessions"
                    onClick={() => setDraft('')}
                    className="text-sm text-muted hover:text-ink"
                  >
                    Clear
                  </Link>
                )}
              </form>
            )}

            {sessions.length === 0 ? (
              <EmptyState
                message={exerciseId ? 'No sessions for this exercise.' : "You haven't completed a session yet."}
                hint="Sessions you save after a guided stretch will appear here."
                actionTo="/exercises"
                actionLabel="Browse exercises"
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th scope="col" className="px-4 sm:px-5 py-3 font-medium">
                          Exercise
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Score
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium hidden sm:table-cell">
                          Duration
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Date
                        </th>
                        <th scope="col" className="px-5 py-3 hidden sm:table-cell">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {sessions.map((session) => (
                        <tr key={session.id} className="align-top">
                          <td className="px-4 sm:px-5 py-4">
                            <Link to={`/exercises/${session.exercise.id}`} className="font-medium hover:text-accent">
                              {session.exercise.title}
                            </Link>
                            <p className="text-xs text-muted">{areaLabel(session.exercise.targetArea)}</p>
                            {session.notes && <p className="mt-1 text-xs text-muted italic max-w-xs">“{session.notes}”</p>}
                          </td>
                          <td className="px-3 py-4">
                            <ScoreBadge score={session.score} />
                          </td>
                          <td className="px-3 py-4 hidden sm:table-cell tabular-nums text-muted">{formatDuration(session.durationSeconds)}</td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {formatDate(session.completedAt)}
                            <p className="text-xs text-muted">{formatTime(session.completedAt)}</p>
                            <div className="mt-2 sm:hidden">
                              <DeleteButton onDelete={() => remove(session)} />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right hidden sm:table-cell">
                            <DeleteButton onDelete={() => remove(session)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
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
