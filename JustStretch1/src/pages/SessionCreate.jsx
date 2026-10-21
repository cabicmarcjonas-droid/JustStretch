import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import { InputError, InputLabel, PrimaryButton } from '../components/forms.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../lib/api.js'
import { areaLabel, hasPlayableVideo, highlightsHands, instructionSteps } from '../lib/enums.js'
import { on } from '../lib/eventBus.js'
import { useFetch, useForm, usePageTitle } from '../lib/hooks.js'
import { thumbnailFor } from '../lib/media.js'
import { FATIGUE_LABELS, toSessionMetrics } from '../lib/sessionMetrics.js'
import { card, container, label as labelClass, sectionTitle, statLabel, textarea } from '../lib/ui.js'
import PoseStage from '../pose/PoseStage.jsx'
import NotFound from './NotFound.jsx'

// Score form. Hidden until the pose tracker emits `session-ended` on the event bus.
// A suggested score from the camera tracking pre-fills the slider and is marked as
// automatic; otherwise the user rates their own form.
function ScoreForm({ exercise }) {
  const navigate = useNavigate()
  const form = useForm({ notes: '' })
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(null)
  const [seconds, setSeconds] = useState(null)
  const [auto, setAuto] = useState(false)
  const [summary, setSummary] = useState(null)
  const [fatigue, setFatigue] = useState(null)
  const section = useRef(null)

  useEffect(
    () =>
      on('session-ended', (detail) => {
        setSeconds(detail.seconds)
        setSummary(detail.summary ?? null)
        setAuto(detail.score != null)
        if (detail.score != null) setScore(detail.score)
        setOpen(true)
      }),
    [],
  )

  useEffect(() => {
    if (open) section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open])

  if (!open) return null

  const judged = summary && summary.hasReference && summary.judgedFrames >= summary.minJudgedFrames

  const submit = (event) => {
    event.preventDefault()
    form.submit(async ({ notes }) => {
      const { message } = await api.post(`/exercises/${exercise.id}/sessions`, {
        score,
        durationSeconds: seconds,
        notes,
        // The camera results, in the names the API stores them under.
        ...toSessionMetrics(summary),
        ...(fatigue == null ? {} : { fatigue }),
      })
      navigate('/dashboard', { state: { flash: message } })
    })
  }

  return (
    <section ref={section} className={`${card} scroll-mt-20 p-6 sm:p-8`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={sectionTitle}>How did it go?</h2>
        <p className="text-sm text-slate-500">
          Session length{' '}
          <span className="font-bold tabular-nums text-ink">
            {seconds !== null && seconds !== '' ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : '—'}
          </span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Tracking results: filled in by the session-ended event */}
        {summary && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            {judged ? (
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="font-bold">Tracking results</h3>
                    <p className="text-sm text-slate-500">
                      <span className="font-bold tabular-nums text-ink">{summary.goodFrames}</span> of{' '}
                      <span className="tabular-nums">{summary.judgedFrames}</span> judged frames were within the margin of error.
                    </p>
                  </div>
                  <span className="text-4xl font-black italic tracking-tighter tabular-nums text-accent">
                    {`${Math.round((100 * summary.goodFrames) / summary.judgedFrames)}%`}
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-slate-500">
                      <tr>
                        <th className="py-1 text-left font-bold">Joint</th>
                        <th className="py-1 text-right font-bold">Average error</th>
                        <th className="py-1 text-right font-bold">Time in range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.joints.map((joint) => (
                        <tr key={joint.name} className="border-t border-slate-200">
                          <td className="py-2 capitalize">{joint.name.replace(/_/g, ' ')}</td>
                          <td className="py-2 text-right tabular-nums">{`${joint.meanErrorDeg.toFixed(1)}°`}</td>
                          <td className={`py-2 text-right font-bold tabular-nums ${joint.inRangePct >= 80 ? 'text-accent' : 'text-red-700'}`}>
                            {`${joint.inRangePct}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <h3 className="font-bold">No tracking score for this session</h3>
                <p className="mt-1 text-slate-600">
                  {!summary.hasReference
                    ? 'This exercise has no reference pose yet, so rate your form yourself.'
                    : `Only ${summary.judgedFrames} frames could be judged (at least ${summary.minJudgedFrames} are needed). Keep your upper body fully in view and try again.`}
                </p>
                {summary.hasReference && summary.camera && (
                  <p className="mt-1 text-slate-600">
                    {summary.camera === 'Cam_Side'
                      ? 'This stretch is tracked from the side: stand sideways to the camera.'
                      : 'This stretch is tracked from the front: face the camera.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className={`space-y-6 ${summary ? '' : 'lg:col-span-2'}`}>
          <div>
            <div className="flex items-end justify-between">
              <InputLabel htmlFor="score" value="Form score" />
              <span className="text-3xl font-black italic tracking-tighter tabular-nums text-accent">{score ?? '—'}</span>
            </div>
            <p className="text-[13px] text-slate-500">How well did you hold the form? 0 = couldn&apos;t do it, 100 = perfect.</p>
            {auto && <p className="text-[13px] font-semibold text-accent">Suggested from your camera tracking. You can adjust it before saving.</p>}
            <input
              id="score"
              name="score"
              type="range"
              min="0"
              max="100"
              step="1"
              value={score ?? 50}
              onChange={(event) => setScore(Number(event.target.value))}
              className="mt-3 w-full accent-emerald-700"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <InputError messages={form.errors.score} className="mt-2" />
            <InputError messages={form.errors.durationSeconds} className="mt-2" />
          </div>

          <div>
            <p className={labelClass}>How tired do you feel?</p>
            <p className="text-[13px] text-slate-500">Optional. Your own rating of how tired your body felt at the end.</p>
            <div role="group" aria-label="Fatigue rating" className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFatigue(fatigue === level ? null : level)}
                  aria-pressed={fatigue === level}
                  className={`h-11 flex-1 rounded-xl border text-sm font-bold tabular-nums transition-colors ${
                    fatigue === level
                      ? 'border-accent bg-accent text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-slate-500">
              {fatigue == null ? 'Not set' : `${fatigue} — ${FATIGUE_LABELS[fatigue]}`}
            </p>
            <InputError messages={form.errors.fatigue} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="notes" value="Notes (optional)" />
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              className={`mt-1.5 ${textarea}`}
              placeholder="e.g. Left side felt tighter than the right."
              {...form.bind('notes')}
            />
            <InputError messages={form.errors.notes} className="mt-2" />
          </div>

          <InputError messages={form.errors._form} />

          <div className="flex justify-end">
            <PrimaryButton size="lg" disabled={form.processing}>
              Save session
            </PrimaryButton>
          </div>
        </form>
      </div>
    </section>
  )
}

// The reference video fills its tile. Without a playable file it shows the poster frame or a note.
function ReferenceVideo({ url }) {
  if (url && hasPlayableVideo(url)) {
    return (
      <video
        src={url}
        poster={thumbnailFor(url) ?? undefined}
        controls
        loop
        playsInline
        muted
        preload="metadata"
        className="h-full w-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-white/80">
      <Icon name="camera" className="h-8 w-8" strokeWidth={1.4} />
      <p className="text-sm font-semibold">{url ? 'This video plays on its original site.' : 'Demo video coming soon.'}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-300 underline underline-offset-2">
          Open the video
        </a>
      ) : (
        <p className="text-xs text-white/60">Follow the steps below the camera.</p>
      )}
    </div>
  )
}

// One step at a time under the tiles, so the user can read it from a distance.
function StepCaption({ steps }) {
  const [index, setIndex] = useState(0)
  if (steps.length === 0) return null
  const stepButton =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40'

  return (
    <div className={`${card} flex items-center gap-4 p-4 sm:p-5`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-black text-white">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className={statLabel}>
          Step {index + 1} of {steps.length}
        </p>
        <p className="mt-0.5 text-base font-semibold leading-snug sm:text-lg" aria-live="polite">
          {steps[index]}
        </p>
      </div>
      <div className="flex gap-2">
        <button type="button" className={stepButton} onClick={() => setIndex((i) => i - 1)} disabled={index === 0} aria-label="Previous step">
          <Icon name="chevronLeft" className="h-5 w-5" />
        </button>
        <button
          type="button"
          className={stepButton}
          onClick={() => setIndex((i) => i + 1)}
          disabled={index === steps.length - 1}
          aria-label="Next step"
        >
          <Icon name="chevronRight" className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Session mode has its own slim bar instead of the app navigation, so the tiles get the room.
function SessionBar({ exercise, stopButton }) {
  const navigate = useNavigate()
  const exitTo = `/exercises/${exercise.id}`

  const exit = (event) => {
    // The tracker enables End session only while a session is running.
    if (stopButton.current && !stopButton.current.disabled) {
      event.preventDefault()
      if (window.confirm('Leave this session? Your progress will not be saved.')) navigate(exitTo)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className={`${container} flex h-16 items-center gap-4`}>
        <Link
          to={exitTo}
          onClick={exit}
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <Icon name="x" className="h-4 w-4" strokeWidth={2.2} />
          Exit
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-base font-black italic tracking-tighter sm:text-lg">{exercise.title}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs font-black uppercase tracking-widest text-accent">{areaLabel(exercise.targetArea)}</span>
          <DifficultyBadge difficulty={exercise.difficulty} />
        </div>
      </div>
    </header>
  )
}

function SessionShell({ title, children }) {
  usePageTitle(title)
  return <div className="min-h-screen">{children}</div>
}

export default function SessionCreate() {
  const { id } = useParams()
  const { data, error, loading } = useFetch(`/exercises/${id}`)
  const stopButton = useRef(null)

  if (error?.status === 404) return <NotFound />

  if (!data) {
    return (
      <SessionShell title="Session">
        <div className={`${container} py-10`}>
          <p className={`text-sm ${error ? 'text-red-700' : 'text-slate-500'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading session…' : `Could not load this exercise: ${error?.message}`}
          </p>
        </div>
      </SessionShell>
    )
  }

  const { exercise } = data
  const area = areaLabel(exercise.targetArea).toLowerCase()

  return (
    <SessionShell title={`Session · ${exercise.title}`}>
      <SessionBar exercise={exercise} stopButton={stopButton} />

      <div className={`${container} space-y-6 pb-16 pt-6`}>
        <PoseStage
          key={exercise.id}
          videoUrl={exercise.videoUrl}
          targetArea={exercise.targetArea}
          stopButtonRef={stopButton}
          reference={<ReferenceVideo url={exercise.videoUrl} />}
        >
          <StepCaption steps={instructionSteps(exercise.instructions)} />
        </PoseStage>

        <ScoreForm exercise={exercise} />

        <div className="grid gap-4 md:grid-cols-2">
          {exercise.precautions && (
            <section className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="note">
              <Icon name="warn" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <div>
                <h2 className="font-bold">Precautions</h2>
                <p className="mt-1 leading-relaxed">{exercise.precautions}</p>
              </div>
            </section>
          )}

          <section className={`${card} flex gap-3 p-5 text-sm`}>
            <Icon name="body" className="h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 className="font-bold">Joints highlighted</h2>
              <p className="mt-1 leading-relaxed text-slate-600">
                Joints for the <strong className="text-ink">{area}</strong> are drawn larger in green; the rest of the skeleton is grey.{' '}
                {highlightsHands(exercise.targetArea)
                  ? 'Your fingers are tracked too (21 points per hand) and drawn in green for this stretch.'
                  : 'Your fingers are tracked too, shown in grey.'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </SessionShell>
  )
}
