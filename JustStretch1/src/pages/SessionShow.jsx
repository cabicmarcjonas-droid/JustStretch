import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import Thumbnail from '../components/Thumbnail.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { areaLabel, formatDuration } from '../lib/enums.js'
import { formatDateLong, formatTime } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { FATIGUE_LABELS, jointLabel } from '../lib/sessionMetrics.js'
import { btn, card, container, pageTitle, sectionTitle, statLabel } from '../lib/ui.js'
import NotFound from './NotFound.jsx'

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

// The per-joint table: how far off the reference each joint was, and how often
// it stayed inside its margin of error.
function JointTable({ joints }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th scope="col" className="py-1 text-left font-bold">
              Joint
            </th>
            <th scope="col" className="py-1 text-right font-bold">
              Average error
            </th>
            <th scope="col" className="py-1 text-right font-bold">
              Time in range
            </th>
          </tr>
        </thead>
        <tbody>
          {joints.map((joint) => (
            <tr key={joint.joint} className="border-t border-slate-200">
              <td className="py-2 capitalize">{jointLabel(joint.joint)}</td>
              <td className="py-2 text-right tabular-nums">{`${Number(joint.avgError ?? 0).toFixed(1)}°`}</td>
              <td
                className={`py-2 text-right font-bold tabular-nums ${joint.timeInRangePct >= 80 ? 'text-accent' : 'text-red-700'}`}
              >
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
    <section className={`${card} p-6`}>
      <h2 className={sectionTitle}>Tracking results</h2>

      {hasTracking ? (
        <>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
            <p>
              <span className="font-bold tabular-nums text-ink">{judged ?? '—'}</span> frames judged
            </p>
            <p>
              <span className="font-bold tabular-nums text-ink">{within ?? '—'}</span> within margin
            </p>
            {dropped > 0 && (
              <p>
                <span className="font-bold tabular-nums text-ink">{dropped}</span> dropped
              </p>
            )}
          </div>

          {joints.length > 0 ? (
            <JointTable joints={joints} />
          ) : (
            <p className="mt-4 text-sm text-slate-600">No joint was tracked long enough to report on.</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
    <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-accent">
      <Icon name="arrowLeft" className="h-4 w-4" strokeWidth={2.2} />
      My sessions
    </Link>
  )

  if (error?.status === 403) {
    return (
      <AppLayout title="Not allowed" header={backLink}>
        <div className={`${container} py-16`}>
          <h1 className={pageTitle}>This session isn&apos;t yours</h1>
          <p className="mt-2 text-[15px] text-slate-600">Only the member who completed a session can open it.</p>
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
        <div className={`${container} py-16`}>
          <p className={`text-sm ${error ? 'text-red-700' : 'text-slate-500'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading session…' : `Could not load this session: ${error?.message}`}
          </p>
        </div>
      </AppLayout>
    )
  }

  const { session } = data
  const exercise = session.exercise
  const judged = session.judgedFrames ?? null

  const header = (
    <>
      {backLink}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className={pageTitle}>{exercise ? exercise.title : 'Deleted exercise'}</h1>
        <ScoreBadge score={session.score} />
      </div>
      <p className="mt-1 text-[15px] text-slate-600">
        {exercise ? `${areaLabel(exercise.targetArea)} · ` : ''}
        {formatDateLong(session.completedAt)} · {formatTime(session.completedAt)}
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
      <div className={`${container} space-y-6 pb-16 pt-6`}>
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 [&>*]:min-w-0" aria-label="Session results">
          {stats.map(([label, value, note]) => (
            <Stat key={label} label={label} value={value} note={note} small={label === 'Duration'} />
          ))}
        </section>

        <section className={`${card} p-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <Thumbnail videoUrl={exercise?.videoUrl} className="h-14 w-20 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              {exercise ? (
                <Link to={`/exercises/${exercise.id}`} className="text-lg font-bold hover:text-accent">
                  {exercise.title}
                </Link>
              ) : (
                <p className="text-lg font-bold text-slate-500">Deleted exercise</p>
              )}
              {session.notes && <p className="mt-1 text-sm italic text-slate-600">“{session.notes}”</p>}
            </div>
          </div>
        </section>

        <TrackingResults session={session} />
      </div>
    </AppLayout>
  )
}
