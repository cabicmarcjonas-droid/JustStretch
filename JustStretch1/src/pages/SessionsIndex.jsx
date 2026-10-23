import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import Pagination from '../components/Pagination.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import ScoreChart from '../components/ScoreChart.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api, toQuery } from '../lib/api.js'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { emit } from '../lib/eventBus.js'
import { formatDate, formatTime, plural } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { FATIGUE_LABELS } from '../lib/sessionMetrics.js'
import { card, container, pageTitle, sectionTitle, select, statLabel } from '../lib/ui.js'

const PER_PAGE = 15

const header = (
  <>
    <h1 className={pageTitle}>My sessions</h1>
    <p className="mt-1 text-[15px] text-slate-600">Every stretch you&apos;ve completed, newest first. Only you can see this list.</p>
  </>
)

function DeleteButton({ onDelete, label }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  )
}

function Summary({ summary }) {
  const minutes = Math.round(summary.totalSeconds / 60)
  const delta =
    summary.averageScore != null && summary.previousAverageScore != null ? summary.averageScore - summary.previousAverageScore : null

  const items = [
    [`Sessions · ${summary.days} days`, summary.count, `${minutes} ${plural('minute', minutes)} in total`],
    [
      'Average score',
      summary.averageScore ?? '—',
      delta == null ? (
        `Previous ${summary.days} days: —`
      ) : (
        <span className={delta >= 0 ? 'font-bold text-accent' : 'font-bold text-amber-700'}>
          {delta >= 0 ? '+' : '−'}
          {Math.abs(delta)} vs previous {summary.days} days
        </span>
      ),
    ],
    ['Best score', summary.best?.score ?? '—', summary.best ? `${summary.best.title ?? 'Deleted exercise'} · ${formatDate(summary.best.completedAt)}` : 'Nothing yet'],
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      {items.map(([labelText, value, note]) => (
        <div key={labelText} className={`${card} p-5`}>
          <p className={statLabel}>{labelText}</p>
          <p className="mt-2 text-4xl font-black italic tracking-tighter tabular-nums">{value}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{note}</p>
        </div>
      ))}
    </div>
  )
}

export default function SessionsIndex() {
  const [params, setParams] = useSearchParams()
  const exerciseId = params.get('exercise') ?? ''
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)

  const { data, error, loading, reload } = useFetch(`/sessions${toQuery({ exercise: exerciseId, page: page > 1 ? page : '' })}`)

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
      <div className={`${container} space-y-6 pb-16 pt-6`}>
        {loading && (
          <p className="text-sm text-slate-500" role="status">
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
            {data.summary && (
              <section className="grid gap-6 lg:grid-cols-[1fr_300px] [&>*]:min-w-0">
                <div className={`${card} p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className={sectionTitle}>Last {data.summary.days} days</h2>
                    {data.exercises.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label htmlFor="exercise" className="text-sm font-semibold text-slate-600">
                          Show
                        </label>
                        <select
                          id="exercise"
                          name="exercise"
                          className={`${select} h-10 w-56 text-sm`}
                          value={exerciseId}
                          onChange={(event) => setParams(event.target.value ? { exercise: event.target.value } : {})}
                        >
                          <option value="">All exercises</option>
                          {data.exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                              {exercise.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <ScoreChart points={data.history ?? []} className="mt-5" />
                </div>
                <Summary summary={data.summary} />
              </section>
            )}

            {sessions.length === 0 ? (
              <EmptyState
                message={exerciseId ? 'No sessions for this exercise' : "You haven't completed a session yet"}
                hint="Sessions you save after a guided stretch will appear here."
                actionTo="/exercises"
                actionLabel="Browse exercises"
              />
            ) : (
              <>
                <div className={`${card} overflow-x-auto`}>
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-left">
                      <tr className={statLabel}>
                        <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                          Exercise
                        </th>
                        <th scope="col" className="px-3 py-3 font-bold">
                          Score
                        </th>
                        <th scope="col" className="hidden px-3 py-3 font-bold sm:table-cell">
                          Duration
                        </th>
                        <th scope="col" className="px-3 py-3 font-bold">
                          Date
                        </th>
                        <th scope="col" className="px-4 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sessions.map((session) => (
                        <tr key={session.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-3">
                              <Thumbnail videoUrl={session.exercise?.videoUrl} className="hidden h-10 w-14 shrink-0 rounded-lg sm:block" />
                              <div className="min-w-0">
                                {session.exercise ? (
                                  <Link to={`/exercises/${session.exercise.id}`} className="font-bold hover:text-accent">
                                    {session.exercise.title}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-slate-500">Deleted exercise</span>
                                )}
                                {session.exercise && <p className="text-xs text-slate-500">{areaLabel(session.exercise.targetArea)}</p>}
                                {session.notes && <p className="mt-1 max-w-xs text-xs italic text-slate-500">“{session.notes}”</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <ScoreBadge score={session.score} />
                              {session.fatigue != null && (
                                <span
                                  title={`Fatigue: ${FATIGUE_LABELS[session.fatigue]}`}
                                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600"
                                >
                                  Fatigue {session.fatigue}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="hidden px-3 py-3 tabular-nums text-slate-600 sm:table-cell">{formatDuration(session.durationSeconds)}</td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {formatDate(session.completedAt)}
                            <p className="text-xs text-slate-500">{formatTime(session.completedAt)}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                to={`/sessions/${session.id}`}
                                className="text-sm font-bold text-accent transition-colors hover:text-accent-dark"
                              >
                                Details
                              </Link>
                              <DeleteButton onDelete={() => remove(session)} label={`Delete session from ${formatDate(session.completedAt)}`} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination meta={data.meta} perPage={PER_PAGE} to={pageLink} noun="sessions" />
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
