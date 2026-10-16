import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseCard from '../components/ExerciseCard.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { firstName, formatDateLong, plural, timeAgo } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'

const stat = 'rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm'
const statLabel = 'text-xs font-black uppercase tracking-widest text-slate-400'
const statValue = 'mt-2 text-4xl font-black italic tracking-tighter tabular-nums text-slate-900'
const sectionTitle = 'text-center text-3xl font-black italic tracking-tighter text-slate-900'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch('/dashboard')

  return (
    <AppLayout title="Dashboard">
      <section className="mx-auto max-w-5xl px-6 pb-10 pt-16 text-center">
        <p className="text-sm font-bold text-slate-500">{formatDateLong(new Date())}</p>
        <h1 className="mb-4 mt-2 text-5xl font-black tracking-tight text-slate-900 md:text-7xl">Welcome back, {firstName(user.name)}!</h1>
        <p className="text-xl font-medium text-slate-500">Ready for today&apos;s stretch?</p>
        <Link
          to="/exercises"
          className="mt-10 inline-block rounded-2xl bg-emerald-600 px-10 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95"
        >
          Get Started &rarr;
        </Link>
      </section>

      {loading && (
        <p className="px-6 pb-16 text-center text-sm text-slate-500" role="status">
          Loading your dashboard…
        </p>
      )}
      {error && (
        <p className="px-6 pb-16 text-center text-sm text-red-700" role="alert">
          Could not load your dashboard: {error.message}
        </p>
      )}
      {data && <DashboardBody data={data} />}
    </AppLayout>
  )
}

function DashboardBody({ data }) {
  const { totalSessions, averageScore, minutesThisWeek, topArea, streak, recentSessions, suggestions } = data

  // Benefits come from the suggested exercises, without repeats.
  const benefits = [...new Set(suggestions.flatMap((exercise) => exercise.benefits))].slice(0, 6)

  return (
    <>
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 lg:grid-cols-4">
        <div className={stat}>
          <p className={statLabel}>Total sessions</p>
          <p className={statValue}>{totalSessions}</p>
        </div>
        <div className={stat}>
          <p className={statLabel}>Avg. score · 7 days</p>
          <p className={statValue}>{averageScore ?? '—'}</p>
        </div>
        <div className={stat}>
          <p className={statLabel}>Minutes this week</p>
          <p className={statValue}>{minutesThisWeek}</p>
        </div>
        <div className={stat}>
          <p className={statLabel}>Most practised</p>
          <p className={`${statValue} break-words text-2xl sm:text-4xl`}>{topArea ? areaLabel(topArea) : '—'}</p>
        </div>
      </section>

      {/* Suggestions: the signature hover-lift cards */}
      <section id="workouts" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${sectionTitle} mb-12`}>Try something new</h2>
        {suggestions.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            The library is empty.{' '}
            <Link to="/exercises/new" className="font-bold text-emerald-600 underline">
              Add the first exercise
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-3">
            {suggestions.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}
      </section>

      {/* Streak: consecutive days with a saved session */}
      <section id="streak" className="my-4 bg-slate-950 py-20 text-center text-white">
        <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Streak Tracker</h2>
        <p className="mt-4 text-7xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
          {streak} {plural('day', streak)}
        </p>
        <p className="mt-3 text-sm font-medium text-slate-400">
          {streak > 0 ? 'Keep it going: stretch again tomorrow.' : 'Save a session today to start your streak.'}
        </p>
      </section>

      {/* Recent sessions */}
      <section className="mx-auto max-w-3xl px-6 pt-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Recent sessions</h2>
          {recentSessions.length > 0 && (
            <Link to="/sessions" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <EmptyState
            message="No sessions yet"
            hint="Pick a stretch from the library and start your first guided session."
            actionTo="/exercises"
            actionLabel="Browse exercises"
          />
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {recentSessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <Link to={`/exercises/${session.exercise.id}`} className="block truncate font-bold hover:text-emerald-600">
                    {session.exercise.title}
                  </Link>
                  <p className="text-xs font-medium text-slate-500">
                    {areaLabel(session.exercise.targetArea)} · {formatDuration(session.durationSeconds)} · {timeAgo(session.completedAt)}
                  </p>
                </div>
                <ScoreBadge score={session.score} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Benefits of the suggested stretches */}
      {benefits.length > 0 && (
        <section id="benefits" className="mx-auto max-w-3xl px-6 py-20">
          <h2 className={`${sectionTitle} mb-10`}>Benefits</h2>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition-colors hover:border-emerald-200"
              >
                <span className="font-black text-emerald-500">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
