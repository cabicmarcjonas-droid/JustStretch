import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import LimbBreakdown from '../components/LimbBreakdown.jsx'
import LimbFilter from '../components/LimbFilter.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import ScoreChart, { TargetLegend } from '../components/ScoreChart.jsx'
import ReferralCard from '../components/ReferralCard.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { firstName, formatDateLong, greeting, plural, timeAgo, weekdayOf } from '../lib/format.js'
import { LIMB_IDS, limbAreas, limbLabel } from '../lib/limbs.js'
import { api } from '../lib/api.js'
import { useCountUp, useFetch } from '../lib/hooks.js'
import { btn, card, cardHead, pageTitle, sectionTitle, statLabel } from '../lib/ui.js'

const WEEKLY_GOAL_MINUTES = 60

export default function Dashboard() {
  const { user } = useAuth()
  // The limb selection lives in the URL (?limbs=leftArm,rightLeg), like the
  // exercise library's filters, so a filtered dashboard can be shared or reopened.
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = [...new Set((searchParams.get('limbs') ?? '').split(',').filter((id) => LIMB_IDS.includes(id)))]
  const setLimbs = (next) => {
    const params = new URLSearchParams(searchParams)
    if (next.length > 0) params.set('limbs', next.join(','))
    else params.delete('limbs')
    setSearchParams(params, { replace: true })
  }

  // One endpoint for both modes: without ?limbs the response is exactly what the
  // dashboard always returned; with it the averages, chart and log are rebuilt
  // from the sessions' per-limb frame counts.
  const path = selected.length > 0 ? `/dashboard?limbs=${selected.join(',')}` : '/dashboard'
  // keepPrevious: a limb click re-scores the page in place instead of unmounting it
  // behind a loading message (which collapsed the page and threw the scroll to the top).
  const { data, error, loading, refreshing } = useFetch(path, { keepPrevious: true })
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
      {data && (
        <DashboardBody
          data={data}
          painAreas={user.painAreas ?? []}
          selectedLimbs={selected}
          onLimbsChange={setLimbs}
          refreshing={refreshing}
        />
      )}
    </AppLayout>
  )
}

// While re-scoring, the panels that depend on the limb filter fade back a little. The
// delay keeps a fast response from flickering; coming back is immediate.
const dimmed = (refreshing) => `transition-opacity duration-200 ${refreshing ? 'opacity-55 delay-150' : ''}`

function DashboardBody({ data, painAreas, selectedLimbs, onLimbsChange, refreshing }) {
  const { totalSessions, averageScore, previousAverageScore, minutesThisWeek, topArea, topAreaSessions, streak } = data
  const filtered = (data.limbs ?? []).length > 0
  // Changes when a new limb selection's data lands, to replay the swap-in.
  const dataKey = (data.limbs ?? []).join(',') || 'all'
  const recentDays = data.recentDays ?? []
  const scoreHistory = data.scoreHistory ?? []
  const { recentSessions, suggestions } = data
  const [pick, ...others] = suggestions

  const delta = averageScore != null && previousAverageScore != null ? averageScore - previousAverageScore : null
  const inRange = scoreHistory.filter((p) => p.score >= 80).length

  return (
    <div className="space-y-6 pb-10">
      <Insight pick={pick} />

      <section className="grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        {pick ? <SuggestedNext exercise={pick} matchesPainArea={painAreas.includes(pick.targetArea)} /> : <EmptyLibrary />}
        <Adherence streak={streak} days={recentDays} minutes={minutesThisWeek} />
      </section>

      <section
        className={`${card} grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4 ${dimmed(refreshing)}`}
        aria-label="Your stats"
        aria-busy={refreshing}
      >
        <Vital label="Total sessions" value={<CountUp value={totalSessions} />} note="All time" />
        <Vital
          label="Avg. score (7 days)"
          value={averageScore == null ? '—' : <CountUp value={averageScore} />}
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
        <Vital label="Minutes this week" value={<CountUp value={minutesThisWeek} />} note="Since Monday" />
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
          <span className="flex items-center gap-3">
            <span role="status" className={`text-xs text-muted transition-opacity duration-200 ${refreshing ? 'opacity-100 delay-150' : 'opacity-0'}`}>
              {refreshing ? 'Updating…' : ''}
            </span>
            <TargetLegend />
          </span>
        </div>
        <div className="space-y-4 p-5">
          {/* Feature: limb filter. "All limbs" (empty selection) keeps the original
              summary; picking limbs re-scores everything from the sessions'
              per-limb frame counts. */}
          <LimbFilter selected={selectedLimbs} onChange={onLimbsChange} busy={refreshing} />
          <div className={dimmed(refreshing)} aria-busy={refreshing}>
            <div key={dataKey} className="animate-swap-in">
              {filtered ? <FilteredFormScore data={data} /> : <AllLimbsFormScore scoreHistory={scoreHistory} inRange={inRange} />}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className={`${card} overflow-hidden ${dimmed(refreshing)}`} aria-busy={refreshing}>
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
              message={filtered ? 'No sessions for these limbs' : 'No sessions yet'}
              hint={
                filtered
                  ? 'Save a camera-tracked session that works the selected limbs.'
                  : 'Pick a stretch and start your first guided session.'
              }
              actionTo="/exercises"
              actionLabel="Browse exercises"
            />
          ) : (
            <div key={dataKey} className="animate-swap-in">
              <SessionLog sessions={recentSessions} limbFiltered={filtered} />
            </div>
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
                        {areaLabel(exercise.targetArea)}, {exercise.durationMinutes} min
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

// The original form score summary, shown when "All limbs" is active. Untouched
// behaviour: the last-14-sessions chart of the sessions' own scores.
function AllLimbsFormScore({ scoreHistory, inRange }) {
  return (
    <div>
      <ScoreChart points={scoreHistory} />
      {scoreHistory.length > 1 && (
        <p className="mt-3 text-sm text-muted">
          {inRange} of your last {scoreHistory.length} sessions were in the target range.
        </p>
      )}
    </div>
  )
}

// The limb-filtered form score summary. The headline number and the per-limb bars
// come from the API's frame-weighted aggregation (sum of good frames over sum of
// judged frames across the selected limbs), so a limb judged on many frames counts
// proportionally more than one judged on few.
function FilteredFormScore({ data }) {
  const { averageScore, previousAverageScore, limbBreakdown = [], limbSessions, limbSessionsTotal, scoreHistory = [] } = data
  const delta = averageScore != null && previousAverageScore != null ? averageScore - previousAverageScore : null
  const inRange = scoreHistory.filter((p) => p.score >= 80).length

  // No tracked session has ever involved these limbs: explain, and suggest
  // exercises from the library whose target area works them.
  if (limbSessionsTotal === 0) {
    return <LimbEmptyState limbs={data.limbs} />
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[40px] font-medium leading-none tabular-nums text-accent">
            {averageScore == null ? '—' : <CountUp value={averageScore} />}
          </p>
          <p className="mt-1.5 text-[13px] text-muted">
            {limbSessions > 0
              ? `Based on ${limbSessions} ${plural('session', limbSessions)} in the last 7 days`
              : 'No sessions with these limbs in the last 7 days'}
          </p>
        </div>
        {delta != null && (
          <p className="text-sm">
            <span className={delta >= 0 ? 'text-accent' : 'text-caution'}>
              {delta >= 0 ? '+' : '−'}
              {Math.abs(delta)} vs last week
            </span>
          </p>
        )}
      </div>

      <LimbBreakdown
        results={limbBreakdown}
        showMissing={false}
        highlightWeakest
        heading="Per-limb breakdown"
        className="border-t border-line pt-4"
      />

      <div className="border-t border-line pt-4">
        <ScoreChart points={scoreHistory} />
        {scoreHistory.length > 1 && (
          <p className="mt-3 text-sm text-muted">
            {inRange} of your last {scoreHistory.length} sessions scored 80 or more on these limbs.
          </p>
        )}
      </div>
    </div>
  )
}

// Empty state for a limb with no data at all: what happened, and what to do about
// it. Suggestions come from the library's own area filter, one request per body
// area the limb works, stopping at the first area that has exercises.
function LimbEmptyState({ limbs }) {
  const areas = [...new Set(limbs.flatMap((id) => limbAreas(id)))]
  const areaKey = areas.join('|')
  const [suggestion, setSuggestion] = useState(null) // null while looking, {} when nothing found

  useEffect(() => {
    let cancelled = false
    const look = async () => {
      for (const area of areas) {
        try {
          const { data } = await api.get(`/exercises?area=${area}&page=1`)
          if (!cancelled && data.data.length > 0) {
            setSuggestion({ area, exercises: data.data.slice(0, 3) })
            return
          }
        } catch {
          // Suggestions are a nice-to-have; the message below stands on its own.
        }
      }
      if (!cancelled) setSuggestion({})
    }
    look()
    return () => {
      cancelled = true
    }
    // The area list only changes when the limb selection does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaKey])

  const label = limbs.map((id) => limbLabel(id)).join(' and ')

  return (
    <div>
      <p className="text-sm font-semibold text-ink">No tracked sessions for this limb yet</p>
      <p className="mt-1 text-sm text-ink-2">
        Camera-tracked sessions that work your {label} will score it here. Sessions rated by hand have no limb results.
      </p>
      {suggestion?.exercises?.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className={statLabel}>Try these {areaLabel(suggestion.area)} exercises</p>
          <ul className="mt-2 divide-y divide-line">
            {suggestion.exercises.map((exercise) => (
              <li key={exercise.id}>
                <Link
                  to={`/exercises/${exercise.id}/session`}
                  className="flex items-center gap-3 py-2 transition-colors hover:bg-paper"
                >
                  <Thumbnail videoUrl={exercise.videoUrl} className="h-9 w-14 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{exercise.title}</span>
                    <span className={statLabel}>
                      {areaLabel(exercise.targetArea)}, {exercise.durationMinutes} min
                    </span>
                  </span>
                  <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SessionLog({ sessions, limbFiltered = false }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className={`${statLabel} px-5 py-2.5 font-medium`}>Exercise</th>
            <th className={`${statLabel} hidden px-3 py-2.5 font-medium sm:table-cell`}>Area</th>
            <th className={`${statLabel} px-3 py-2.5 text-right font-medium`}>Time</th>
            <th className={`${statLabel} hidden px-3 py-2.5 font-medium sm:table-cell`}>When</th>
            <th className={`${statLabel} px-5 py-2.5 text-right font-medium`}>{limbFiltered ? 'Limb score' : 'Score'}</th>
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
                {/* With a limb filter the column shows the session's frame-weighted
                    score across the selected limbs, not its whole-body score. */}
                <ScoreBadge score={limbFiltered && session.limbScore != null ? session.limbScore : session.score} />
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
        <p className="text-[13px] font-medium text-accent">Suggested next</p>
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

// Narrative recommendation (GET /api/dashboard/insight). The server picks the best and
// worst area, the lowest-scoring exercise and any referral; Groq only words the summary.
// "Up next" is not part of the cached text because Suggested next can change on every
// visit, so it is always rendered from the card's own exercise. Nothing shows until the
// member has a session, and a failed request just hides the card.
function Insight({ pick }) {
  const { data, loading } = useFetch('/dashboard/insight')

  if (loading) {
    return (
      <section className={`${card} p-5 sm:p-6`} aria-busy="true">
        <p className={statLabel}>Your progress</p>
        <p className="mt-2 text-sm text-muted" role="status">
          Summarising your recent sessions…
        </p>
      </section>
    )
  }
  if (!data?.narrative) return null

  const { narrative, source, bestArea, worstArea, lowestExercise, referral } = data
  const sameArea = bestArea.area === worstArea.area

  return (
    <div className="space-y-4">
      <section className={`${card} p-5 sm:p-6`} aria-labelledby="insight-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="insight-title" className={statLabel}>
            Your progress
          </h2>
          {source === 'groq' && <p className="text-xs text-muted">Written by AI from your scores</p>}
        </div>
        <p className="mt-2 max-w-3xl text-[17px] leading-relaxed text-ink">{narrative}</p>

        <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line text-sm sm:grid-cols-3">
          <div className="bg-surface px-4 py-3">
            <dt className={statLabel}>{sameArea ? 'Practised so far' : 'Strongest area'}</dt>
            <dd className="mt-0.5 font-medium">
              {bestArea.label} <span className="font-mono text-muted">{bestArea.score}</span>
            </dd>
          </div>
          {!sameArea && (
            <div className="bg-surface px-4 py-3">
              <dt className={statLabel}>Needs work</dt>
              <dd className="mt-0.5 font-medium">
                {worstArea.label} <span className="font-mono text-muted">{worstArea.score}</span>
              </dd>
            </div>
          )}
          <div className={`bg-surface px-4 py-3 ${sameArea ? 'sm:col-span-2' : ''}`}>
            <dt className={statLabel}>Lowest-scoring exercise</dt>
            <dd className="mt-0.5 truncate font-medium">
              <Link to={`/exercises/${lowestExercise.id}`} className="text-accent hover:underline">
                {lowestExercise.title}
              </Link>{' '}
              <span className="font-mono text-muted">{lowestExercise.score}</span>
            </dd>
          </div>
        </dl>

        {pick && (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2">
            <Icon name="play" className="h-4 w-4 shrink-0 text-accent" />
            Up next:
            <Link to={`/exercises/${pick.id}/session`} className="font-medium text-accent hover:underline">
              {pick.title}
            </Link>
          </p>
        )}
      </section>

      {referral && <ReferralCard referral={referral} />}
    </div>
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
                <span className={`text-[11px] ${day.date === today ? 'text-ink' : 'text-muted'}`}>{weekdayOf(day.date)}</span>
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

// A figure that counts from its previous value to the new one when the data changes,
// so a re-scored number reads as a change rather than a swap. Text only, no layout work.
function CountUp({ value }) {
  const shown = useCountUp(value)
  return shown
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
