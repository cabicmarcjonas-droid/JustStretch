import { Link } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import ScoreChart, { TargetLegend } from '../components/ScoreChart.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { firstName, formatDateLong, greeting, plural, timeAgo, weekdayOf } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { btn, card, cardHead, pageTitle, sectionTitle, statLabel } from '../lib/ui.js'

const WEEKLY_GOAL_MINUTES = 60

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch('/dashboard')
  const pick = data?.suggestions?.[0]

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={statLabel}>{formatDateLong(new Date())}</p>
        <h1 className={`mt-1.5 ${pageTitle}`}>
          {greeting()}, {firstName(user.name)}
        </h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/exercises" className={`${btn.secondary} ${btn.md}`}>
          Browse exercises
        </Link>
        {pick && (
          <Link to={`/exercises/${pick.id}/session`} className={`${btn.primary} ${btn.md}`}>
            <Icon name="play" className="h-4 w-4" />
            Start today&apos;s session
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <AppLayout title="Dashboard" header={header}>
      {loading && (
        <p className="py-16 text-sm text-muted" role="status">
          Loading your dashboard…
        </p>
      )}
      {error && (
        <p className="py-16 text-sm text-danger" role="alert">
          Could not load your dashboard: {error.message}
        </p>
      )}
      {data && <DashboardBody data={data} painAreas={user.painAreas ?? []} />}
    </AppLayout>
  )
}

function DashboardBody({ data, painAreas }) {
  const { totalSessions, averageScore, previousAverageScore, minutesThisWeek, topArea, topAreaSessions, streak } = data
  const recentDays = data.recentDays ?? []
  const scoreHistory = data.scoreHistory ?? []
  const { recentSessions, suggestions } = data
  const [pick, ...others] = suggestions

  const delta = averageScore != null && previousAverageScore != null ? averageScore - previousAverageScore : null
  const inRange = scoreHistory.filter((p) => p.score >= 80).length

  return (
    <div className="space-y-6 pb-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        {pick ? <SuggestedNext exercise={pick} matchesPainArea={painAreas.includes(pick.targetArea)} /> : <EmptyLibrary />}
        <Adherence streak={streak} days={recentDays} minutes={minutesThisWeek} />
      </section>

      <section className={`${card} grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`} aria-label="Your stats">
        <Vital label="Total sessions" value={totalSessions} note="All time" />
        <Vital
          label="Avg. score · 7 days"
          value={averageScore ?? '—'}
          note={
            delta == null ? (
              'Nothing to compare yet'
            ) : (
              <span className={delta >= 0 ? 'text-accent' : 'text-caution'}>
                {delta >= 0 ? '+' : '−'}
                {Math.abs(delta)} vs last week
              </span>
            )
          }
        />
        <Vital label="Minutes this week" value={minutesThisWeek} note="Since Monday" />
        <Vital
          label="Most practised"
          value={topArea ? areaLabel(topArea) : '—'}
          note={topArea ? `${topAreaSessions} ${plural('session', topAreaSessions)}` : 'Nothing yet'}
          small
        />
      </section>

      <section className={`${card} overflow-hidden`}>
        <div className={`${cardHead} flex flex-wrap items-center justify-between gap-3`}>
          <h2 className={sectionTitle}>Form score</h2>
          <TargetLegend />
        </div>
        <div className="p-5">
          <ScoreChart points={scoreHistory} />
          {scoreHistory.length > 1 && (
            <p className="mt-3 text-sm text-muted">
              {inRange} of your last {scoreHistory.length} sessions were in the target range.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className={`${card} overflow-hidden`}>
          <div className={`${cardHead} flex items-center justify-between gap-4`}>
            <h2 className={sectionTitle}>Session log</h2>
            {recentSessions.length > 0 && (
              <Link to="/sessions" className="text-sm font-medium text-accent hover:text-accent-dark">
                View all
              </Link>
            )}
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState
              className="m-5"
              message="No sessions yet"
              hint="Pick a stretch and start your first guided session."
              actionTo="/exercises"
              actionLabel="Browse exercises"
            />
          ) : (
            <SessionLog sessions={recentSessions} />
          )}
        </div>

        {others.length > 0 && (
          <div className={`${card} self-start overflow-hidden`}>
            <h2 className={`${cardHead} ${sectionTitle}`}>Not tried yet</h2>
            <ul className="divide-y divide-line">
              {others.map((exercise) => (
                <li key={exercise.id}>
                  <Link to={`/exercises/${exercise.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper">
                    <Thumbnail videoUrl={exercise.videoUrl} className="h-10 w-14 shrink-0 rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{exercise.title}</span>
                      <span className={statLabel}>
                        {areaLabel(exercise.targetArea)} · {exercise.durationMinutes} min
                      </span>
                    </span>
                    <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

function SessionLog({ sessions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className={`${statLabel} px-5 py-2.5 font-medium`}>Exercise</th>
            <th className={`${statLabel} hidden px-3 py-2.5 font-medium sm:table-cell`}>Area</th>
            <th className={`${statLabel} px-3 py-2.5 text-right font-medium`}>Time</th>
            <th className={`${statLabel} hidden px-3 py-2.5 font-medium sm:table-cell`}>When</th>
            <th className={`${statLabel} px-5 py-2.5 text-right font-medium`}>Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sessions.map((session) => (
            <tr key={session.id}>
              <td className="px-5 py-3">
                {session.exercise ? (
                  <Link to={`/sessions/${session.id}`} className="font-medium hover:text-accent">
                    {session.exercise.title}
                  </Link>
                ) : (
                  <span className="text-muted">Deleted exercise</span>
                )}
              </td>
              <td className="hidden px-3 py-3 text-ink-2 sm:table-cell">{session.exercise ? areaLabel(session.exercise.targetArea) : '—'}</td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-ink-2">{formatDuration(session.durationSeconds)}</td>
              <td className="hidden px-3 py-3 text-ink-2 sm:table-cell">{timeAgo(session.completedAt)}</td>
              <td className="px-5 py-3 text-right">
                <ScoreBadge score={session.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SuggestedNext({ exercise, matchesPainArea }) {
  const specs = [
    ['Area', areaLabel(exercise.targetArea)],
    ['Time', `${exercise.durationMinutes} min`],
    ['Sets × reps', `${exercise.sets ?? 1} × ${exercise.repsPerSet ?? 1}`],
  ]
  return (
    <article className={`${card} grid overflow-hidden md:grid-cols-[1fr_1.1fr]`}>
      <Thumbnail videoUrl={exercise.videoUrl} label className="aspect-video md:aspect-auto md:min-h-64" />
      <div className="flex flex-col p-5 sm:p-6">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-accent">Suggested next</p>
        <h2 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.02em]">{exercise.title}</h2>
        <div className="mt-2">
          <DifficultyBadge difficulty={exercise.difficulty} />
        </div>
        <dl className="mt-4 grid grid-cols-3 border-y border-line">
          {specs.map(([k, v]) => (
            <div key={k} className="py-2.5 pr-3">
              <dt className={statLabel}>{k}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {matchesPainArea && (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
            <Icon name="body" className="h-4 w-4 shrink-0 text-accent" />
            Matches a pain area you marked on your profile.
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Link to={`/exercises/${exercise.id}/session`} className={`${btn.primary} ${btn.md}`}>
            <Icon name="play" className="h-4 w-4" />
            Start session
          </Link>
          <Link to={`/exercises/${exercise.id}`} className={`${btn.secondary} ${btn.md}`}>
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

// Streak, the last 7 days as cells (today outlined), and minutes against a weekly goal.
function Adherence({ streak, days, minutes }) {
  const today = days.at(-1)?.date
  const pct = Math.min(100, Math.round((minutes / WEEKLY_GOAL_MINUTES) * 100))
  return (
    <div className={`${card} flex flex-col overflow-hidden`}>
      <h2 className={`${cardHead} ${sectionTitle}`}>Adherence</h2>
      <div className="flex flex-1 flex-col p-5">
        <p className={statLabel}>Day streak</p>
        <p className="mt-1 font-mono text-[40px] font-medium leading-none tabular-nums">
          {streak}
          <span className="ms-2 font-sans text-base font-normal text-muted">{plural('day', streak)}</span>
        </p>
        <p className="mt-2 text-sm text-ink-2">
          {streak > 0 ? 'Stretch again tomorrow to keep it going.' : 'Save a session today to start a streak.'}
        </p>
        {days.length > 0 && (
          <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Last 7 days">
            {days.map((day) => (
              <li key={day.date} className="flex flex-col items-center gap-1">
                <span
                  className={`block h-7 w-full rounded-sm ${day.active ? 'bg-accent' : 'bg-paper-2'} ${
                    day.date === today ? 'outline-2 outline-offset-1 outline-ink' : ''
                  }`}
                  title={day.date}
                >
                  <span className="sr-only">{day.active ? 'Stretched' : 'No session'}</span>
                </span>
                <span className={`font-mono text-[10px] ${day.date === today ? 'text-ink' : 'text-muted'}`}>{weekdayOf(day.date)}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-auto pt-5">
          <div className="flex items-baseline justify-between">
            <span className={statLabel}>Minutes this week</span>
            <span className="font-mono text-sm">
              {minutes} / {WEEKLY_GOAL_MINUTES}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-sm bg-paper-2" aria-hidden="true">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Vital({ label, value, note, small = false }) {
  return (
    <div className="min-w-0 bg-surface p-5">
      <p className={statLabel}>{label}</p>
      <p className={`mt-2 truncate tabular-nums ${small ? 'text-[22px] font-semibold leading-8' : 'font-mono text-[32px] font-medium leading-8'}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[13px] text-muted">{note}</p>
    </div>
  )
}
