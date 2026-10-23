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
import { formatDate, initials, plural } from '../lib/format.js'
import { useFetch } from '../lib/hooks.js'
import { thumbnailFor } from '../lib/media.js'
import { btn, card, cardHead, pageTitle, sectionTitle, statLabel } from '../lib/ui.js'
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
        <p className={`py-10 text-sm ${error ? 'text-danger' : 'text-muted'}`} role={error ? 'alert' : 'status'}>
          {loading ? 'Loading exercise…' : `Could not load this exercise: ${error?.message}`}
        </p>
      </AppLayout>
    )
  }

  const { exercise, recentSessions } = data
  const stats = data.stats ?? { attempts: 0, best: null, averageScore: null }
  const isAuthor = exercise.author.id === user.id
  const area = areaLabel(exercise.targetArea)
  const sets = exercise.sets ?? 1
  const reps = exercise.repsPerSet ?? 1
  const live = thumbnailFor(exercise.videoUrl) != null

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
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link to="/exercises" className="hover:text-accent">
          Exercise library
        </Link>
        <Icon name="chevronRight" className="h-3.5 w-3.5" />
        <span className="truncate text-ink-2">{exercise.title}</span>
      </nav>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={pageTitle}>{exercise.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-accent">{area}</span>
            <DifficultyBadge difficulty={exercise.difficulty} />
            <span className="font-mono">{exercise.durationMinutes} min</span>
            <span className="font-mono">
              {sets} {plural('set', sets)} × {reps} {plural('rep', reps)}
            </span>
            <span className="flex items-center gap-2 text-muted">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-paper-2 font-mono text-[10px] text-ink-2">
                {initials(exercise.author.name)}
              </span>
              Added by {isAuthor ? 'you' : exercise.author.name} · {formatDate(exercise.createdAt)}
            </span>
          </div>
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
      <div className="grid gap-6 pb-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <VideoPanel url={exercise.videoUrl} />

          <section className={`${card} overflow-hidden`}>
            <h2 className={`${cardHead} ${sectionTitle}`}>About this stretch</h2>
            <p className="p-5 text-[15px] leading-relaxed text-ink-2">{exercise.description}</p>
          </section>

          <section className={`${card} overflow-hidden`}>
            <h2 className={`${cardHead} ${sectionTitle}`}>Steps</h2>
            <ol className="divide-y divide-line">
              {instructionSteps(exercise.instructions).map((step, index) => (
                <li key={index} className="flex gap-4 px-5 py-3.5">
                  <span className="w-6 shrink-0 pt-0.5 font-mono text-sm font-medium text-accent">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-[15px] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {(exercise.benefits.length > 0 || exercise.precautions) && (
            <div className="grid gap-6 md:grid-cols-2">
              {exercise.benefits.length > 0 && (
                <section className={`${card} overflow-hidden`}>
                  <h2 className={`${cardHead} ${sectionTitle}`}>Benefits</h2>
                  <ul className="divide-y divide-line">
                    {exercise.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2.5 px-5 py-3 text-sm">
                        <Icon name="check" className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.4} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {exercise.precautions && (
                <section className="overflow-hidden rounded-lg border border-caution/40 bg-caution-soft" role="note">
                  <h2 className="flex items-center gap-2 border-b border-caution/30 px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-caution">
                    <Icon name="warn" className="h-4 w-4" />
                    Precautions
                  </h2>
                  <p className="p-5 text-sm leading-relaxed text-ink">{exercise.precautions}</p>
                </section>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className={`${card} overflow-hidden`}>
            <h2 className={`${cardHead} ${sectionTitle}`}>Ready to try it?</h2>
            <dl className="divide-y divide-line px-5 text-sm">
              {[
                ['Tracked joints', area],
                ['Feedback', live ? 'Live score' : 'Self-rated'],
                ['Structure', `${sets} × ${reps} timed holds`],
                ['Camera', 'Stays on this device'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className={statLabel}>{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="p-5 pt-2">
              <Link to={`/exercises/${exercise.id}/session`} className={`${btn.primary} ${btn.lg} w-full`}>
                <Icon name="play" className="h-4 w-4" />
                Start session
              </Link>
            </div>
          </div>

          <div className={`${card} overflow-hidden`}>
            <h2 className={`${cardHead} ${sectionTitle}`}>Your results</h2>
            <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
              {[
                ['Attempts', stats.attempts],
                ['Best', stats.best ?? '—'],
                ['Average', stats.averageScore ?? '—'],
              ].map(([labelText, value]) => (
                <div key={labelText} className="px-4 py-3">
                  <dt className={statLabel}>{labelText}</dt>
                  <dd className="mt-1 font-mono text-[24px] font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            {recentSessions.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">You haven&apos;t tried this stretch yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentSessions.map((session) => (
                  <li key={session.id}>
                    <Link to={`/sessions/${session.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-paper">
                      <span>
                        <span className="block font-medium">{formatDate(session.completedAt)}</span>
                        <span className="font-mono text-xs text-muted">{formatDuration(session.durationSeconds)}</span>
                      </span>
                      <ScoreBadge score={session.score} />
                    </Link>
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
            <h2 className="text-xl font-semibold tracking-[-0.01em]">Delete “{exercise.title}”?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
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
