import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseCard from '../components/ExerciseCard.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { firstName, formatDateLong, timeAgo } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'

const card = 'rounded-2xl border border-line bg-white p-5'
const cardLabel = 'text-xs font-medium uppercase tracking-wide text-muted'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch('/dashboard')

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted">{formatDateLong(new Date())}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Hi, {firstName(user.name)}</h1>
      </div>
      <Link
        to="/exercises"
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark"
      >
        Find a stretch
      </Link>
    </div>
  )

  return (
    <AppLayout title="Dashboard" header={header}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && (
          <p className="text-sm text-muted" role="status">
            Loading your dashboard…
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700" role="alert">
            Could not load your dashboard: {error.message}
          </p>
        )}
        {data && <DashboardBody data={data} />}
      </div>
    </AppLayout>
  )
}

function DashboardBody({ data }) {
  const { totalSessions, averageScore, minutesThisWeek, topArea, recentSessions, suggestions } = data

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={card}>
          <p className={cardLabel}>Total sessions</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{totalSessions}</p>
        </div>
        <div className={card}>
          <p className={cardLabel}>Avg. score · 7 days</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{averageScore ?? '—'}</p>
        </div>
        <div className={card}>
          <p className={cardLabel}>Minutes this week</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{minutesThisWeek}</p>
        </div>
        <div className={card}>
          <p className={cardLabel}>Most practised</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold">{topArea ? areaLabel(topArea) : '—'}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Recent sessions */}
        <section className="min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Recent sessions</h2>
            {recentSessions.length > 0 && (
              <Link to="/sessions" className="text-sm text-accent hover:text-accent-dark">
                View all
              </Link>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <EmptyState
              className="mt-4"
              message="No sessions yet"
              hint="Pick a stretch from the library and start your first guided session."
              actionTo="/exercises"
              actionLabel="Browse exercises"
            />
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
              {recentSessions.map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <Link to={`/exercises/${session.exercise.id}`} className="font-medium hover:text-accent truncate block">
                      {session.exercise.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {areaLabel(session.exercise.targetArea)} · {formatDuration(session.durationSeconds)} · {timeAgo(session.completedAt)}
                    </p>
                  </div>
                  <ScoreBadge score={session.score} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Suggestions */}
        <section>
          <h2 className="font-display text-2xl font-semibold">Try something new</h2>
          {suggestions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              The library is empty.{' '}
              <Link to="/exercises/new" className="text-accent underline">
                Add the first exercise
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {suggestions.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
