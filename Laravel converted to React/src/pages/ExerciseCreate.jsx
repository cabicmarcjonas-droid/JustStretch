import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import ExerciseForm from './ExerciseForm.jsx'

const header = (
  <>
    <Link to="/exercises" className="text-sm text-muted hover:text-ink">
      &larr; Exercise library
    </Link>
    <h1 className="mt-3 font-display text-3xl font-semibold">Add an exercise</h1>
    <p className="mt-1 text-sm text-muted">Share a stretch that helps you. You can edit or remove it later; other members can&apos;t.</p>
  </>
)

export default function ExerciseCreate() {
  const navigate = useNavigate()

  const create = async (values) => {
    const { exercise } = await api.post('/exercises', values)
    navigate('/exercises', { state: { flash: `"${exercise.title}" was added to the library.` } })
  }

  return (
    <AppLayout title="Add exercise" header={header}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExerciseForm submitLabel="Add to library" cancelTo="/exercises" onSubmit={create} />
      </div>
    </AppLayout>
  )
}
