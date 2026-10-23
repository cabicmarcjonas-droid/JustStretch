import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { pageTitle } from '../lib/ui.js'
import ExerciseForm from './ExerciseForm.jsx'

const header = (
  <div className="max-w-3xl">
    <Link to="/exercises" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent">
      <Icon name="arrowLeft" className="h-4 w-4" />
      Exercise library
    </Link>
    <h1 className={`mt-3 ${pageTitle}`}>Add an exercise</h1>
    <p className="mt-1 text-[15px] text-ink-2">Share a stretch that helps you. You can edit or remove it later; other members can&apos;t.</p>
  </div>
)

export default function ExerciseCreate() {
  const navigate = useNavigate()

  const create = async (values) => {
    const { exercise } = await api.post('/exercises', values)
    navigate('/exercises', { state: { flash: `"${exercise.title}" was added to the library.` } })
  }

  return (
    <AppLayout title="Add exercise" header={header}>
      <div className="max-w-3xl pb-10">
        <ExerciseForm submitLabel="Add to library" cancelTo="/exercises" onSubmit={create} />
      </div>
    </AppLayout>
  )
}
