import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import ReferralCard from '../components/ReferralCard.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { formatDateLong, formatTime } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { FATIGUE_LABELS, jointLabel } from '../lib/sessionMetrics.js'
import { btn, card, cardHead, pageTitle, sectionTitle, statLabel } from '../lib/ui.js'
import NotFound from './NotFound.jsx'

function Vital({ label, value, note, small = false }) {
  return (
    <div className="min-w-0 bg-surface p-5">
      <p className={statLabel}>{label}</p>
      <p className={`mt-2 truncate tabular-nums ${small ? 'font-mono text-[24px] font-medium leading-8' : 'font-mono text-[32px] font-medium leading-8'}`}>
        {value}
      </p>
      <p className="mt-1.5 truncate text-[13px] text-muted">{note}</p>
    </div>
  )
}

// The per-joint table: how far off the reference each joint was, and how often
// it stayed inside its margin of error.
function JointTable({ joints }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className={`${statLabel} px-5 py-2.5 text-left font-medium`}>
              Joint
            </th>
            <th scope="col" className={`${statLabel} px-3 py-2.5 text-right font-medium`}>
              Average error
            </th>
            <th scope="col" className={`${statLabel} px-5 py-2.5 text-right font-medium`}>
              Time in range
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {joints.map((joint) => (
            <tr key={joint.joint}>
              <td className="px-5 py-2.5 font-medium capitalize">{jointLabel(joint.joint)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{`${Number(joint.avgError ?? 0).toFixed(1)}°`}</td>
              <td className={`px-5 py-2.5 text-right font-mono font-medium ${joint.timeInRangePct >= 80 ? 'text-accent' : 'text-danger'}`}>
                {`${joint.timeInRangePct}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// How the camera did: frames judged, frames inside the margin, frames dropped.
function TrackingResults({ session }) {
  const joints = session.jointResults ?? []
  const judged = session.judgedFrames ?? null
  const within = session.framesWithinMargin ?? null
  const dropped = session.droppedFrames ?? null
  const hasTracking = session.trackingScore != null || joints.length > 0

  return (
    <section className={`${card} overflow-hidden`}>
      <div className={`${cardHead} flex flex-wrap items-center justify-between gap-3`}>
        <h2 className={sectionTitle}>Tracking results</h2>
        {hasTracking && (
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
            <span>{judged ?? '—'} frames judged</span>
            <span>{within ?? '—'} within margin</span>
            {dropped > 0 && <span>{dropped} dropped</span>}
          </p>
        )}
      </div>

      {hasTracking ? (
        joints.length > 0 ? (
          <JointTable joints={joints} />
        ) : (
          <p className="px-5 py-4 text-sm text-ink-2">No joint was tracked long enough to report on.</p>
        )
      ) : (
        <p className="px-5 py-4 text-sm leading-relaxed text-ink-2">
          This session has no camera tracking data. It was scored by hand, so there are no per-joint results to show.
        </p>
      )}
    </section>
  )
}

export default function SessionShow() {
  const { id } = useParams()
  const { data, error, loading } = useFetch(`/sessions/${id}`)

  if (error?.status === 404) return <NotFound />

  const backLink = (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
      <Link to="/sessions" className="hover:text-accent">
        My sessions
      </Link>
      <Icon name="chevronRight" className="h-3.5 w-3.5" />
      <span className="text-ink-2">Session</span>
    </nav>
  )

  if (error?.status === 403) {
    return (
      <AppLayout title="Not allowed" header={backLink}>
        <div className="py-10">
          <h1 className={pageTitle}>This session isn&apos;t yours</h1>
          <p className="mt-2 text-[15px] text-ink-2">Only the member who completed a session can open it.</p>
          <div className="mt-6">
            <Link to="/sessions" className={`${btn.secondary} ${btn.md}`}>
              Back to my sessions
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout title="Session" header={backLink}>
        <p className={`py-10 text-sm ${error ? 'text-danger' : 'text-muted'}`} role={error ? 'alert' : 'status'}>
          {loading ? 'Loading session…' : `Could not load this session: ${error?.message}`}
        </p>
      </AppLayout>
    )
  }

  const { session } = data
  const exercise = session.exercise
  const judged = session.judgedFrames ?? null

  const header = (
    <>
      {backLink}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className={pageTitle}>{exercise ? exercise.title : 'Deleted exercise'}</h1>
        <ScoreBadge score={session.score} />
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm text-muted">
        {exercise && <span>{areaLabel(exercise.targetArea)}</span>}
        <span>
          {formatDateLong(session.completedAt)}, {formatTime(session.completedAt)}
        </span>
      </p>
    </>
  )

  const stats = [
    ['Form score', session.score, 'Out of 100'],
    [
      'Tracking score',
      session.trackingScore ?? '—',
      session.trackingScore == null ? 'No camera tracking' : judged != null ? `From ${judged} judged frames` : 'From camera tracking',
    ],
    ['Duration', formatDuration(session.durationSeconds), 'Session length'],
    ['Fatigue', session.fatigue ?? '—', session.fatigue == null ? 'Not recorded' : FATIGUE_LABELS[session.fatigue]],
  ]

  return (
    <AppLayout title={`Session · ${exercise?.title ?? 'Stretch'}`} header={header}>
      <div className="space-y-6 pb-10">
        <section className={`${card} grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`} aria-label="Session results">
          {stats.map(([label, value, note]) => (
            <Vital key={label} label={label} value={value} note={note} small={label === 'Duration'} />
          ))}
        </section>

        <ReferralCard referral={session.referral} />

        <div className="grid gap-6 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
          <TrackingResults session={session} />

          <section className={`${card} self-start overflow-hidden`}>
            <h2 className={`${cardHead} ${sectionTitle}`}>Exercise and notes</h2>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Thumbnail videoUrl={exercise?.videoUrl} className="h-12 w-[72px] shrink-0 rounded-md" />
                {exercise ? (
                  <Link to={`/exercises/${exercise.id}`} className="font-medium hover:text-accent">
                    {exercise.title}
                  </Link>
                ) : (
                  <p className="font-medium text-muted">Deleted exercise</p>
                )}
              </div>
              <div>
                <p className={statLabel}>Your notes</p>
                <p className="mt-1 text-sm text-ink-2">{session.notes ? `“${session.notes}”` : 'No notes for this session.'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
