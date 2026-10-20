import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { useFetch } from '../lib/hooks.js'
import { pageTitle } from '../lib/ui.js'
import ExerciseForm from './ExerciseForm.jsx'
import Forbidden from './Forbidden.jsx'
import NotFound from './NotFound.jsx'

const body = 'mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-8 md:px-0'

export default function ExerciseEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading } = useFetch(`/exercises/${id}`)
  const [forbidden, setForbidden] = useState(false)

  if (error?.status === 404) return <NotFound />

  // Only the author may edit (ExercisePolicy). Anyone else gets the 403 page; the API
  // enforces the same rule on PUT, so this never depends on the check below alone.
  if (forbidden || (data && data.exercise.author.id !== user.id)) return <Forbidden />

  if (!data) {
    return (
      <AppLayout title="Edit exercise">
        <div className={body}>
          <p className={`text-sm ${error ? 'text-red-700' : 'text-slate-500'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading exercise…' : `Could not load this exercise: ${error?.message}`}
          </p>
        </div>
      </AppLayout>
    )
  }

  const { exercise } = data

  const header = (
    <div className="mx-auto max-w-3xl">
      <Link
        to={`/exercises/${exercise.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-accent"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back to exercise
      </Link>
      <h1 className={`mt-4 ${pageTitle}`}>Edit “{exercise.title}”</h1>
    </div>
  )

  const save = async (values) => {
    await api.put(`/exercises/${exercise.id}`, values)
    navigate(`/exercises/${exercise.id}`, { state: { flash: 'Your changes were saved.' } })
  }

  return (
    <AppLayout title={`Edit ${exercise.title}`} header={header}>
      <div className={body}>
        <ExerciseForm
          exercise={exercise}
          submitLabel="Save changes"
          cancelTo={`/exercises/${exercise.id}`}
          onSubmit={save}
          onForbidden={() => setForbidden(true)}
        />
      </div>
    </AppLayout>
  )
}
