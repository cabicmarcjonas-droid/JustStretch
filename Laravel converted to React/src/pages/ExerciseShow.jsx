import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DangerButton, SecondaryButton } from '../components/forms.jsx'
import DifficultyBadge from '../components/DifficultyBadge.jsx'
import Modal from '../components/Modal.jsx'
import ScoreBadge from '../components/ScoreBadge.jsx'
import VideoPanel from '../components/VideoPanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { areaLabel, formatDuration, instructionSteps } from '../lib/enums.js'
import { formatDate } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className={`text-sm ${error ? 'text-red-700' : 'text-muted'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading exercise…' : `Could not load this exercise: ${error?.message}`}
          </p>
        </div>
      </AppLayout>
    )
  }

  const { exercise, recentSessions } = data
  const isAuthor = exercise.author.id === user.id

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
      <Link to="/exercises" className="text-sm text-muted hover:text-ink">
        &larr; Exercise library
      </Link>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-accent">{areaLabel(exercise.targetArea)}</span>
            <DifficultyBadge difficulty={exercise.difficulty} />
            <span className="text-xs text-muted">· {exercise.durationMinutes} min</span>
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">{exercise.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Added by {isAuthor ? 'you' : exercise.author.name} · {formatDate(exercise.createdAt)}
          </p>
        </div>

        {isAuthor && (
          <div className="flex gap-2">
            <Link
              to={`/exercises/${exercise.id}/edit`}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-line bg-white text-sm font-medium hover:border-ink"
            >
              Edit
            </Link>
            <DangerButton type="button" onClick={() => setConfirming(true)}>
              Delete
            </DangerButton>
          </div>
        )}
      </div>
    </>
  )

  return (
    <AppLayout title={exercise.title} header={header}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8 min-w-0">
          <VideoPanel url={exercise.videoUrl} />

          <section>
            <h2 className="font-display text-2xl font-semibold">About this stretch</h2>
            <p className="mt-3 text-muted leading-relaxed">{exercise.description}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Steps</h2>
            <ol className="mt-4 space-y-3">
              {instructionSteps(exercise.instructions).map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-dark">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Benefits</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {exercise.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm">
                  <svg className="h-5 w-5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          {exercise.precautions && (
            <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="note">
              <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z"
                />
              </svg>
              <div>
                <h2 className="font-semibold">Precautions</h2>
                <p className="mt-1 text-sm">{exercise.precautions}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-semibold">Ready to try it?</h2>
            <p className="mt-1 text-sm text-muted">
              Your webcam shows a live skeleton with the {areaLabel(exercise.targetArea).toLowerCase()} joints highlighted.
            </p>
            <Link
              to={`/exercises/${exercise.id}/session`}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
              </svg>
              Start session
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-semibold">Your recent attempts</h2>
            {recentSessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted">You haven&apos;t tried this stretch yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {recentSessions.map((session) => (
                  <li key={session.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p>{formatDate(session.completedAt)}</p>
                      <p className="text-xs text-muted">{formatDuration(session.durationSeconds)}</p>
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
          <div className="p-6">
            <h2 className="font-display text-xl font-semibold">Delete “{exercise.title}”?</h2>
            <p className="mt-2 text-sm text-muted">
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
