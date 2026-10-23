import { Link } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseCard from '../components/ExerciseCard.jsx'
import Icon from '../components/Icon.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import ScoreChart from '../components/ScoreChart.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { firstName, formatDateLong, greeting, plural, timeAgo, weekdayOf } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { btn, card, container, pageTitle, panel, sectionTitle, statLabel } from '../lib/ui.js'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch('/dashboard')

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{formatDateLong(new Date())}</p>
        <h1 className={`mt-1 ${pageTitle}`}>
          {greeting()}, {firstName(user.name)}
        </h1>
      </div>
      <Link to="/exercises" className={`${btn.secondary} ${btn.md}`}>
        Browse exercises
      </Link>
    </div>
  )

  return (
    <AppLayout title="Dashboard" header={header}>
      {loading && (
        <p className={`${container} py-16 text-sm text-slate-500`} role="status">
          Loading your dashboard…
        </p>
      )}
      {error && (
        <p className={`${container} py-16 text-sm text-red-700`} role="alert">
          Could not load your dashboard: {error.message}
        </p>
      )}
      {data && <DashboardBody data={data} />}
    </AppLayout>
  )
}

function DashboardBody({ data }) {
  const { totalSessions, averageScore, previousAverageScore, minutesThisWeek, topArea, topAreaSessions, streak } = data
  const recentDays = data.recentDays ?? []
  const scoreHistory = data.scoreHistory ?? []
  const { recentSessions, suggestions } = data
  const [pick, ...others] = suggestions

  const delta = averageScore != null && previousAverageScore != null ? averageScore - previousAverageScore : null

  return (
    <div className={`${container} space-y-8 pb-16 pt-6`}>
      <section className="grid gap-6 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
        {pick ? <TodaysPick exercise={pick} /> : <EmptyLibrary />}
        <StreakCard streak={streak} days={recentDays} />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 [&>*]:min-w-0" aria-label="Your stats">
        <Stat label="Total sessions" value={totalSessions} note="All time" />
        <Stat
          label="Avg. score · 7 days"
          value={averageScore ?? '—'}
          note={
            delta == null ? (
              'Nothing to compare yet'
            ) : (
              <span className={delta >= 0 ? 'font-bold text-accent' : 'font-bold text-amber-700'}>
                {delta >= 0 ? '+' : '−'}
                {Math.abs(delta)} vs last week
              </span>
            )
          }
        />
        <Stat label="Minutes this week" value={minutesThisWeek} note="Since Monday" />
        <Stat
          label="Most practised"
          value={topArea ? areaLabel(topArea) : '—'}
          note={topArea ? `${topAreaSessions} ${plural('session', topAreaSessions)}` : 'Nothing yet'}
          small
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_420px] [&>*]:min-w-0">
        <div className={`${card} p-6`}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className={sectionTitle}>Form score</h2>
            {scoreHistory.length > 1 && <p className="text-sm text-slate-500">Last {scoreHistory.length} sessions</p>}
          </div>
          <ScoreChart points={scoreHistory} className="mt-5" />
        </div>

        <div className={`${card} flex flex-col p-6`}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className={sectionTitle}>Recent sessions</h2>
            {recentSessions.length > 0 && (
              <Link to="/sessions" className="text-sm font-bold text-accent hover:text-accent-dark">
                View all
              </Link>
            )}
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState
              className="mt-5 flex-1"
              message="No sessions yet"
              hint="Pick a stretch and start your first guided session."
              actionTo="/exercises"
              actionLabel="Browse exercises"
            />
          ) : (
            <ul className="mt-3 divide-y divide-slate-200">
              {recentSessions.map((session) => (
                <li key={session.id} className="flex items-center gap-3 py-3">
                  <Thumbnail videoUrl={session.exercise?.videoUrl} className="h-11 w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    {session.exercise ? (
                      <Link to={`/exercises/${session.exercise.id}`} className="block truncate text-[15px] font-bold hover:text-accent">
                        {session.exercise.title}
                      </Link>
                    ) : (
                      <span className="block truncate text-[15px] font-bold text-slate-500">Deleted exercise</span>
                    )}
                    <p className="truncate text-xs text-slate-500">
                      {session.exercise ? `${areaLabel(session.exercise.targetArea)} · ` : ''}
                      {formatDuration(session.durationSeconds)} · {timeAgo(session.completedAt)}
                    </p>
                  </div>
                  <ScoreBadge score={session.score} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <h2 className={sectionTitle}>Try something new</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TodaysPick({ exercise }) {
  return (
    <article className={`${panel} grid overflow-hidden md:grid-cols-[1.1fr_1fr]`}>
      <Thumbnail videoUrl={exercise.videoUrl} label className="aspect-video md:aspect-auto md:min-h-72">
        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-accent shadow-sm">
          Today&apos;s pick
        </span>
      </Thumbnail>
      <div className="flex flex-col p-6 sm:p-7">
        <p className={statLabel}>{areaLabel(exercise.targetArea)}</p>
        <h2 className="mt-1.5 text-2xl font-black italic leading-tight tracking-tighter sm:text-3xl">{exercise.title}</h2>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <DifficultyBadge difficulty={exercise.difficulty} />
          <span className="font-medium">· {exercise.durationMinutes} min</span>
        </div>
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-slate-600">{exercise.description}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Link to={`/exercises/${exercise.id}/session`} className={`${btn.primary} ${btn.lg}`}>
            <Icon name="play" className="h-4 w-4" />
            Start session
          </Link>
          <Link to={`/exercises/${exercise.id}`} className={`${btn.ghost} ${btn.lg}`}>
            View exercise
          </Link>
        </div>
      </div>
    </article>
  )
}

function EmptyLibrary() {
  return (
    <EmptyState
      message="The library is empty"
      hint="Add the first stretch so everyone has something to practise."
      actionTo="/exercises/new"
      actionLabel="Add an exercise"
    />
  )
}

// Streak count plus a strip of the last 7 days, today ringed.
function StreakCard({ streak, days }) {
  const today = days.at(-1)?.date
  return (
    <div className={`${panel} flex flex-col p-6 sm:p-7`}>
      <p className={statLabel}>Day streak</p>
      <p className="mt-2 text-6xl font-black italic tracking-tighter tabular-nums text-accent">
        {streak}
        <span className="ms-2 text-2xl text-ink">{plural('day', streak)}</span>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        {streak > 0 ? 'Keep it going: stretch again tomorrow.' : 'Save a session today to start your streak.'}
      </p>
      {days.length > 0 && (
        <ol className="mt-auto grid grid-cols-7 gap-1.5 pt-6" aria-label="Last 7 days">
          {days.map((day) => (
            <li key={day.date} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  day.active ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400'
                } ${day.date === today ? 'ring-2 ring-accent ring-offset-2' : ''}`}
                title={day.date}
              >
                {day.active ? <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                <span className="sr-only">{day.active ? 'Stretched' : 'No session'}</span>
              </span>
              <span className={`text-xs font-bold ${day.date === today ? 'text-ink' : 'text-slate-500'}`}>{weekdayOf(day.date)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Stat({ label, value, note, small = false }) {
  return (
    <div className={`${card} p-5`}>
      <p className={statLabel}>{label}</p>
      <p className={`mt-2 truncate font-black italic tracking-tighter tabular-nums text-ink ${small ? 'text-2xl sm:text-3xl' : 'text-4xl'}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  )
}
