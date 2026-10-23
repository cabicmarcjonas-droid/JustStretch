import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import { InputError, InputLabel, PrimaryButton, TEXTAREA_CLASSES } from '../components/forms.jsx'
import VideoPanel from '../components/VideoPanel.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { areaLabel, highlightsHands, instructionSteps } from '../lib/enums.js'
import { plural } from '../lib/format.js'
import { on } from '../lib/eventBus.js'
import { useFetch, useForm } from '../lib/hooks.js'
import PoseStage from '../pose/PoseStage.jsx'
import NotFound from './NotFound.jsx'

// Score form (port of the Alpine x-data section). Hidden until the pose tracker emits
// `session-ended` on the event bus. A suggested score from the camera tracking pre-fills
// the slider and is marked as automatic; otherwise the user rates their own form.
function ScoreForm({ exercise }) {
  const navigate = useNavigate()
  const form = useForm({ notes: '' })
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(null)
  const [seconds, setSeconds] = useState(null)
  const [auto, setAuto] = useState(false)
  const [summary, setSummary] = useState(null)
  const [savedSession, setSavedSession] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const section = useRef(null)
  // One guard per workout: remember the clientId we tried to save, and ignore
  // a late response once the user has started a newer session.
  const savedKeys = useRef(new Set())
  const lastKey = useRef(null)
  const autoSaveToken = useRef(0)

  useEffect(() => {
    return on('session-ended', (detail) => {
      const key = detail.sessionId ?? `${exercise.id}:${detail.seconds}:${Date.now()}`
      lastKey.current = key
      autoSaveToken.current += 1
      setSavedSession(null)
      setSaveError(null)
      setSeconds(detail.seconds)
      setSummary(detail.summary ?? null)
      setAuto(detail.score != null)
      setScore(detail.score ?? null)
      setOpen(true)

      // Only the automatic end condition saves by itself, and only when the
      // camera produced a score (the API requires one). Manual ends keep the
      // ordinary form. The clientId makes a retry idempotent.
      if (detail.reason !== 'complete' || detail.score == null || savedKeys.current.has(key)) return
      savedKeys.current.add(key)
      const token = autoSaveToken.current
      setAutoSaving(true)
      api
        .post(`/exercises/${exercise.id}/sessions`, {
          score: detail.score,
          durationSeconds: detail.seconds,
          clientId: key,
        })
        .then(({ session }) => {
          if (autoSaveToken.current === token) setSavedSession(session)
        })
        .catch((error) => {
          savedKeys.current.delete(key)
          if (autoSaveToken.current === token) setSaveError(error.message)
        })
        .finally(() => {
          if (autoSaveToken.current === token) setAutoSaving(false)
        })
    })
  }, [exercise.id])

  useEffect(() => {
    if (open) section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open])

  if (!open) return null

  const judged = summary && summary.hasReference && summary.judgedFrames >= summary.minJudgedFrames

  const submit = (event) => {
    event.preventDefault()
    form.submit(async ({ notes }) => {
      // Already auto-saved: only send what the user may have changed.
      if (savedSession) {
        const { message } = await api.patch(`/sessions/${savedSession.id}`, { score, notes: notes ?? '' })
        navigate('/dashboard', { state: { flash: message } })
        return
      }

      const { message } = await api.post(`/exercises/${exercise.id}/sessions`, {
        score,
        durationSeconds: seconds,
        notes: notes ?? '',
        clientId: lastKey.current,
      })
      navigate('/dashboard', { state: { flash: message } })
    })
  }

  return (
    <section ref={section} className="rounded-2xl border border-line bg-white p-6 sm:p-8 scroll-mt-6">
      <h2 className="text-2xl font-black italic tracking-tighter">How did it go?</h2>
      <p className="mt-1 text-sm text-muted">
        Session length:{' '}
        <span className="font-medium text-ink tabular-nums">
          {seconds !== null && seconds !== '' ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : '—'}
        </span>
      </p>

      {autoSaving && <p className="mt-2 text-xs text-muted" role="status">Saving this session automatically…</p>}
      {savedSession && (
        <p className="mt-2 text-xs text-accent">
          Saved automatically when the session completed. You can still adjust the score or add notes below.
        </p>
      )}
      {saveError && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          Could not save automatically ({saveError}). Use the button below to save it.
        </p>
      )}

      {/* Tracking results: filled in by the session-ended event */}
      {summary && (
        <div className="mt-6 rounded-xl border border-line bg-stone-50 p-5">
          {judged ? (
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Tracking results</h3>
                  <p className="text-sm text-muted">
                    <span className="font-medium text-ink tabular-nums">{summary.goodFrames}</span> of{' '}
                    <span className="tabular-nums">{summary.judgedFrames}</span> judged frames were within the margin of error.
                  </p>
                  {summary.totalReps > 1 && (
                    <p className="mt-1 text-sm text-muted">
                      Completed <span className="font-medium text-ink tabular-nums">{summary.repsCompleted}</span> of{' '}
                      <span className="tabular-nums">{summary.totalReps}</span> reps across{' '}
                      <span className="font-medium text-ink tabular-nums">{summary.setsCompleted}</span> of{' '}
                      <span className="tabular-nums">{summary.totalSets}</span> sets.
                    </p>
                  )}
                </div>
                <span className="text-4xl tabular-nums text-accent font-black italic tracking-tighter">
                  {`${Math.round((100 * summary.goodFrames) / summary.judgedFrames)}%`}
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="py-1 text-left font-medium">Joint</th>
                      <th className="py-1 text-right font-medium">Average error</th>
                      <th className="py-1 text-right font-medium">Time in range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.joints.map((joint) => (
                      <tr key={joint.name} className="border-t border-line">
                        <td className="py-2 capitalize">{joint.name.replace(/_/g, ' ')}</td>
                        <td className="py-2 text-right tabular-nums">{`${joint.meanErrorDeg.toFixed(1)}°`}</td>
                        <td className={`py-2 text-right font-medium tabular-nums ${joint.inRangePct >= 80 ? 'text-accent' : 'text-red-700'}`}>
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
              <h3 className="font-semibold">No tracking score for this session</h3>
              <p className="mt-1 text-muted">
                {!summary.hasReference
                  ? 'This exercise has no reference pose yet, so rate your form yourself below.'
                  : `Only ${summary.judgedFrames} frames could be judged (at least ${summary.minJudgedFrames} are needed). Keep your upper body fully in view and try again.`}
              </p>
              {summary.hasReference && summary.camera && (
                <p className="mt-1 text-muted">
                  {summary.camera === 'Cam_Side'
                    ? 'This stretch is tracked from the side: stand sideways to the camera.'
                    : 'This stretch is tracked from the front: face the camera.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <div className="flex items-end justify-between">
            <InputLabel htmlFor="score" value="Form score" />
            <span className="text-3xl tabular-nums text-accent font-black italic tracking-tighter">{score ?? '—'}</span>
          </div>
          <p className="text-xs text-muted">How well did you hold the form? 0 = couldn&apos;t do it, 100 = perfect.</p>
          {auto && <p className="text-xs text-accent">Suggested from your camera tracking. You can adjust it before saving.</p>}
          <input
            id="score"
            name="score"
            type="range"
            min="0"
            max="100"
            step="1"
            value={score ?? 50}
            onChange={(event) => setScore(Number(event.target.value))}
            className="mt-3 w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
          <InputError messages={form.errors.score} className="mt-2" />
          <InputError messages={form.errors.durationSeconds} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="notes" value="Notes (optional)" />
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            className={`mt-1 ${TEXTAREA_CLASSES}`}
            placeholder="e.g. Left side felt tighter than the right."
            {...form.bind('notes')}
          />
          <InputError messages={form.errors.notes} className="mt-2" />
        </div>

        <InputError messages={form.errors._form} />

        <div className="flex justify-end">
          <PrimaryButton disabled={form.processing || autoSaving}>
            {savedSession ? 'Update session' : 'Save session'}
          </PrimaryButton>
        </div>
      </form>
    </section>
  )
}

export default function SessionCreate() {
  const { id } = useParams()
  const { data, error, loading } = useFetch(`/exercises/${id}`)

  if (error?.status === 404) return <NotFound />

  if (!data) {
    return (
      <AppLayout title="Session">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className={`text-sm ${error ? 'text-red-700' : 'text-muted'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading session…' : `Could not load this exercise: ${error?.message}`}
          </p>
        </div>
      </AppLayout>
    )
  }

  const { exercise } = data
  const area = areaLabel(exercise.targetArea).toLowerCase()

  const header = (
    <>
      <Link to={`/exercises/${exercise.id}`} className="text-sm text-muted hover:text-ink">
        &larr; Back to exercise
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-accent">{areaLabel(exercise.targetArea)}</span>
        <DifficultyBadge difficulty={exercise.difficulty} />
        <span className="text-xs font-bold text-slate-500">· {exercise.durationMinutes} min</span>
        <span className="text-xs font-bold text-slate-500">
          · {exercise.sets ?? 1} {plural('set', exercise.sets ?? 1)} × {exercise.repsPerSet ?? 1}{' '}
          {plural('rep', exercise.repsPerSet ?? 1)}
        </span>
      </div>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black italic tracking-tighter">{exercise.title}</h1>
    </>
  )

  return (
    <AppLayout title={`Session · ${exercise.title}`} header={header}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
          {/* Left: what to do */}
          <aside className="space-y-6 order-2 lg:order-1">
            <VideoPanel url={exercise.videoUrl} />

            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-semibold">Steps</h2>
              <ol className="mt-3 space-y-3 text-sm">
                {instructionSteps(exercise.instructions).map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-dark">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {exercise.precautions && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="note">
                <h2 className="font-semibold">Precautions</h2>
                <p className="mt-1">{exercise.precautions}</p>
              </section>
            )}

            <section className="rounded-2xl border border-line bg-white p-5 text-sm">
              <h2 className="font-semibold">Joints highlighted</h2>
              <p className="mt-1 text-muted">
                Joints for the <strong className="text-ink">{area}</strong> are drawn larger in green. The rest of the skeleton is shown in
                grey.
              </p>
              <p className="mt-2 text-muted">
                {highlightsHands(exercise.targetArea)
                  ? 'Your fingers are tracked too (21 points per hand) and drawn in green for this stretch.'
                  : 'Your fingers are tracked too, shown in grey.'}
              </p>
            </section>
          </aside>

          {/* Right: camera */}
          <PoseStage
            key={exercise.id}
            videoUrl={exercise.videoUrl}
            targetArea={exercise.targetArea}
            durationMinutes={exercise.durationMinutes}
            sets={exercise.sets ?? 1}
            repsPerSet={exercise.repsPerSet ?? 1}
          />
        </div>

        <ScoreForm exercise={exercise} />
      </div>
    </AppLayout>
  )
}
