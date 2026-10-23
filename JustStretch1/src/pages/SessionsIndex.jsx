import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import Pagination from '../components/Pagination.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import ScoreChart, { TargetLegend } from '../components/ScoreChart.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api, toQuery } from '../lib/api.js'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { emit } from '../lib/eventBus.js'
import { formatDate, formatTime, plural } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { FATIGUE_LABELS } from '../lib/sessionMetrics.js'
import { card, cardHead, pageTitle, sectionTitle, select, statLabel, tag } from '../lib/ui.js'

const PER_PAGE = 15

function DeleteButton({ onDelete, label }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-soft hover:text-danger"
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
        <span className={delta >= 0 ? 'text-accent' : 'text-caution'}>
          {delta >= 0 ? '+' : '−'}
          {Math.abs(delta)} vs previous {summary.days} days
        </span>
      ),
    ],
    [
      'Best score',
      summary.best?.score ?? '—',
      summary.best ? `${summary.best.title ?? 'Deleted exercise'} · ${formatDate(summary.best.completedAt)}` : 'Nothing yet',
    ],
  ]

  return (
    <section className={`${card} grid gap-px overflow-hidden bg-line sm:grid-cols-3`} aria-label="Summary">
      {items.map(([labelText, value, note]) => (
        <div key={labelText} className="min-w-0 bg-surface p-5">
          <p className={statLabel}>{labelText}</p>
          <p className="mt-2 font-mono text-[32px] font-medium leading-8 tabular-nums">{value}</p>
          <p className="mt-1.5 truncate text-[13px] text-muted">{note}</p>
        </div>
      ))}
    </section>
  )
}

function ExerciseFilter({ exercises, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="exercise" className={statLabel}>
        Show
      </label>
      <select id="exercise" name="exercise" className={`${select} h-10 w-56 text-sm`} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All exercises</option>
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {exercise.title}
          </option>
        ))}
      </select>
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
  const history = data?.history ?? []
  const inRange = history.filter((p) => p.score >= 80).length

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className={pageTitle}>My sessions</h1>
        <p className="mt-1 text-[15px] text-ink-2">Every stretch you&apos;ve completed, newest first. Only you can see this list.</p>
      </div>
      {data?.exercises?.length > 0 && (
        <ExerciseFilter
          exercises={data.exercises}
          value={exerciseId}
          onChange={(value) => setParams(value ? { exercise: value } : {})}
        />
      )}
    </div>
  )

  return (
    <AppLayout title="My sessions" header={header}>
      <div className="space-y-6 pb-10">
        {loading && (
          <p className="text-sm text-muted" role="status">
            Loading sessions…
          </p>
        )}
        {error && (
          <p className="text-sm text-danger" role="alert">
            Could not load your sessions: {error.message}
          </p>
        )}

        {data && (
          <>
            {data.summary && (
              <>
                <Summary summary={data.summary} />
                <section className={`${card} overflow-hidden`}>
                  <div className={`${cardHead} flex flex-wrap items-center justify-between gap-3`}>
                    <h2 className={sectionTitle}>Form score · last {data.summary.days} days</h2>
                    <TargetLegend />
                  </div>
                  <div className="p-5">
                    <ScoreChart points={history} />
                    {history.length > 1 && (
                      <p className="mt-3 text-sm text-muted">
                        {inRange} of {history.length} sessions were in the target range.
                      </p>
                    )}
                  </div>
                </section>
              </>
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
                <div className={`${card} overflow-hidden`}>
                  <h2 className={`${cardHead} ${sectionTitle}`}>Session log</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-line text-left">
                        <tr>
                          <th scope="col" className={`${statLabel} px-4 py-2.5 font-medium sm:px-5`}>
                            Exercise
                          </th>
                          <th scope="col" className={`${statLabel} px-3 py-2.5 font-medium`}>
                            Score
                          </th>
                          <th scope="col" className={`${statLabel} hidden px-3 py-2.5 text-right font-medium sm:table-cell`}>
                            Duration
                          </th>
                          <th scope="col" className={`${statLabel} px-3 py-2.5 font-medium`}>
                            Date
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {sessions.map((session) => (
                          <tr key={session.id} className="transition-colors hover:bg-paper">
                            <td className="px-4 py-3 sm:px-5">
                              <div className="flex items-center gap-3">
                                <Thumbnail videoUrl={session.exercise?.videoUrl} className="hidden h-10 w-14 shrink-0 rounded-md sm:block" />
                                <div className="min-w-0">
                                  {session.exercise ? (
                                    <Link to={`/exercises/${session.exercise.id}`} className="font-medium hover:text-accent">
                                      {session.exercise.title}
                                    </Link>
                                  ) : (
                                    <span className="font-medium text-muted">Deleted exercise</span>
                                  )}
                                  {session.exercise && <p className="text-xs text-muted">{areaLabel(session.exercise.targetArea)}</p>}
                                  {session.notes && <p className="mt-1 max-w-xs text-xs text-ink-2">“{session.notes}”</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <ScoreBadge score={session.score} />
                                {session.fatigue != null && (
                                  <span title={`Fatigue: ${FATIGUE_LABELS[session.fatigue]}`} className={tag.neutral}>
                                    Fatigue {session.fatigue}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="hidden px-3 py-3 text-right font-mono text-ink-2 sm:table-cell">
                              {formatDuration(session.durationSeconds)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {formatDate(session.completedAt)}
                              <p className="font-mono text-xs text-muted">{formatTime(session.completedAt)}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/sessions/${session.id}`} className="text-sm font-medium text-accent transition-colors hover:text-accent-dark">
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
