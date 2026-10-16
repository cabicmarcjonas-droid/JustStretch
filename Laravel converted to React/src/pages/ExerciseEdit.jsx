import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { useFetch } from '../lib/hooks.js'
import ExerciseForm from './ExerciseForm.jsx'
import Forbidden from './Forbidden.jsx'
import NotFound from './NotFound.jsx'

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className={`text-sm ${error ? 'text-red-700' : 'text-muted'}`} role={error ? 'alert' : 'status'}>
            {loading ? 'Loading exercise…' : `Could not load this exercise: ${error?.message}`}
          </p>
        </div>
      </AppLayout>
    )
  }

  const { exercise } = data

  const header = (
    <>
      <Link to={`/exercises/${exercise.id}`} className="text-sm text-muted hover:text-ink">
        &larr; Back to exercise
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Edit “{exercise.title}”</h1>
    </>
  )

  const save = async (values) => {
    await api.put(`/exercises/${exercise.id}`, values)
    navigate(`/exercises/${exercise.id}`, { state: { flash: 'Your changes were saved.' } })
  }

  return (
    <AppLayout title={`Edit ${exercise.title}`} header={header}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
