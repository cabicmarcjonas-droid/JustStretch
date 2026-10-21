import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import { DangerButton, SecondaryButton } from '../components/forms.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import VideoPanel from '../components/VideoPanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { areaLabel, formatDuration, instructionSteps } from '../lib/enums.js'
import { formatDate, initials } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { btn, card, container, eyebrow, pageTitle, sectionTitle, statLabel } from '../lib/ui.js'
import Forbidden from './Forbidden.jsx'
import NotFound from './NotFound.jsx'

export default function ExerciseShow() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading } = useFetch(`/exercises/${id}`)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  if (error?.status === 404) return <NotFound />
  if (forbidden) return <Forbidden />

  if (!data) {
    return (
      <AppLayout title="Exercise">
        <div className={`${container} py-10`}>
          <p className={`text-sm ${error ? 'text-red-700' : 'text-slate-500'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading exercise…' : `Could not load this exercise: ${error?.message}`}
          </p>
        </div>
      </AppLayout>
    )
  }

  const { exercise, recentSessions } = data
  const stats = data.stats ?? { attempts: 0, best: null, averageScore: null }
  const isAuthor = exercise.author.id === user.id
  const area = areaLabel(exercise.targetArea)

  const remove = async () => {
    setDeleting(true)
    try {
      await api.delete(`/exercises/${exercise.id}`)
      navigate('/exercises', { state: { flash: `"${exercise.title}" was removed from the library.` } })
    } catch (err) {
      setConfirming(false)
      setDeleting(false)
      if (err.status === 403) setForbidden(true)
    }
  }

  const header = (
    <>
      <Link to="/exercises" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-accent">
        <Icon name="arrowLeft" className="h-4 w-4" />
        Exercise library
      </Link>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={eyebrow}>{area}</span>
            <DifficultyBadge difficulty={exercise.difficulty} />
            <span className="text-sm font-medium text-slate-500">· {exercise.durationMinutes} min</span>
          </div>
          <h1 className={`mt-2 ${pageTitle}`}>{exercise.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent">
              {initials(exercise.author.name)}
            </span>
            Added by {isAuthor ? 'you' : exercise.author.name} · {formatDate(exercise.createdAt)}
          </p>
        </div>

        {isAuthor && (
          <div className="flex gap-2">
            <Link to={`/exercises/${exercise.id}/edit`} className={`${btn.secondary} ${btn.md}`}>
              Edit
            </Link>
            <button type="button" onClick={() => setConfirming(true)} className={`${btn.dangerOutline} ${btn.md}`}>
              Delete
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <AppLayout title={exercise.title} header={header}>
      <div className={`${container} grid gap-8 pb-16 pt-6 lg:grid-cols-[1fr_22rem]`}>
        <div className="min-w-0 space-y-8">
          <VideoPanel url={exercise.videoUrl} />

          <section className={`${card} p-6 sm:p-7`}>
            <h2 className={sectionTitle}>About this stretch</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{exercise.description}</p>

            <h2 className={`${sectionTitle} mt-8`}>Steps</h2>
            <ol className="mt-4 space-y-4">
              {instructionSteps(exercise.instructions).map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-[15px] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {exercise.benefits.length > 0 && (
            <section>
              <h2 className={sectionTitle}>Benefits</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {exercise.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-accent-soft px-3.5 py-1.5 text-sm font-semibold text-accent-dark"
                  >
                    <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {exercise.precautions && (
            <section className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900" role="note">
              <Icon name="warn" className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <div>
                <h2 className="font-bold">Precautions</h2>
                <p className="mt-1 text-sm leading-relaxed">{exercise.precautions}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold">Ready to try it?</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Your webcam shows a live skeleton with the {area.toLowerCase()} joints highlighted. Nothing leaves your device.
            </p>
            <Link to={`/exercises/${exercise.id}/session`} className={`${btn.primary} ${btn.lg} mt-5 w-full`}>
              <Icon name="play" className="h-4 w-4" />
              Start session
            </Link>
          </div>

          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold">Your progress</h2>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Attempts', stats.attempts],
                ['Best', stats.best ?? '—'],
                ['Average', stats.averageScore ?? '—'],
              ].map(([labelText, value]) => (
                <div key={labelText} className="rounded-xl bg-slate-50 px-2 py-3">
                  <dt className={`${statLabel} text-[10px]`}>{labelText}</dt>
                  <dd className="mt-1 text-2xl font-black italic tracking-tighter tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            {recentSessions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">You haven&apos;t tried this stretch yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
                {recentSessions.map((session) => (
                  <li key={session.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold">{formatDate(session.completedAt)}</p>
                      <p className="text-xs text-slate-500">{formatDuration(session.durationSeconds)}</p>
                    </div>
                    <ScoreBadge score={session.score} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {isAuthor && (
        <Modal show={confirming} onClose={() => setConfirming(false)}>
          <div className="p-6 sm:p-7">
            <h2 className="text-xl font-black italic tracking-tighter">Delete “{exercise.title}”?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This removes the exercise from the library for everyone, along with every session logged against it. This cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setConfirming(false)}>Cancel</SecondaryButton>
              <DangerButton type="button" onClick={remove} disabled={deleting}>
                Delete exercise
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
