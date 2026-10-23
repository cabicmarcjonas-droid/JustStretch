import { Link } from 'react-router-dom'
import { InputError, InputLabel, PrimaryButton, SELECT_CLASSES, TEXTAREA_CLASSES, TextInput } from '../components/forms.jsx'
import { areaOptions, difficultyOptions } from '../lib/enums.js'
import { plural } from '../lib/format.js'
import { useForm } from '../lib/hooks.js'

const AREAS = Object.entries(areaOptions())
const DIFFICULTIES = Object.entries(difficultyOptions())
const BENEFIT_INPUTS = 5

// exercises/partials/form.blade.php, shared by the create and edit pages.
// The form always shows five benefit inputs; the API drops the blank ones.
export default function ExerciseForm({ exercise, submitLabel, cancelTo, onSubmit, onForbidden }) {
  const form = useForm({
    title: exercise?.title ?? '',
    targetArea: exercise?.targetArea ?? '',
    difficulty: exercise?.difficulty ?? '',
    durationMinutes: exercise?.durationMinutes ?? '',
    sets: exercise?.sets ?? 1,
    repsPerSet: exercise?.repsPerSet ?? 1,
    description: exercise?.description ?? '',
    instructions: exercise?.instructions ?? '',
    benefits: Array.from({ length: BENEFIT_INPUTS }, (_, i) => exercise?.benefits?.[i] ?? ''),
    precautions: exercise?.precautions ?? '',
    videoUrl: exercise?.videoUrl ?? '',
  })
  const { errors } = form

  // The session is split evenly into timed holds, so this hint shows what each
  // rep will last. Blank/invalid values simply hide it.
  const holdSeconds = (() => {
    const minutes = Number(form.values.durationMinutes)
    const sets = Number(form.values.sets)
    const reps = Number(form.values.repsPerSet)
    if (!minutes || !sets || !reps) return null
    return Math.max(1, Math.round((minutes * 60) / (sets * reps)))
  })()

  const setBenefit = (index, value) =>
    form.setField(
      'benefits',
      form.values.benefits.map((benefit, i) => (i === index ? value : benefit)),
    )

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      try {
        await onSubmit(values)
      } catch (error) {
        if (error.status === 403) {
          onForbidden?.()
          return
        }
        throw error
      }
    })
  }

  const errorCount = Object.entries(errors)
    .filter(([key]) => key !== '_form')
    .reduce((sum, [, messages]) => sum + messages.length, 0)

  // pt-6 matches the gap the Blade form gets from its hidden CSRF input inside space-y-6.
  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6" noValidate>
      {errorCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Please fix the {plural('field', errorCount)} highlighted below.
        </div>
      )}
      {errors._form && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errors._form[0]}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-6 space-y-6">
        <h2 className="text-xl font-black italic tracking-tighter">Basics</h2>

        <div>
          <InputLabel htmlFor="title" value="Title" />
          <TextInput id="title" type="text" className="mt-1 block w-full" maxLength={120} placeholder="e.g. Seated Spinal Twist" {...form.bind('title')} />
          <InputError messages={errors.title} className="mt-2" />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <InputLabel htmlFor="target_area" value="Target area" />
            <select id="target_area" className={`mt-1 block w-full ${SELECT_CLASSES}`} {...form.bind('targetArea')}>
              <option value="">Choose…</option>
              {AREAS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <InputError messages={errors.targetArea} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="difficulty" value="Difficulty" />
            <select id="difficulty" className={`mt-1 block w-full ${SELECT_CLASSES}`} {...form.bind('difficulty')}>
              <option value="">Choose…</option>
              {DIFFICULTIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <InputError messages={errors.difficulty} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="duration_minutes" value="Duration (minutes)" />
            <TextInput id="duration_minutes" type="number" min="1" max="30" className="mt-1 block w-full" {...form.bind('durationMinutes')} />
            <InputError messages={errors.durationMinutes} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="sets" value="Sets" />
            <TextInput id="sets" type="number" min="1" max="20" className="mt-1 block w-full" {...form.bind('sets')} />
            <InputError messages={errors.sets} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="reps_per_set" value="Reps per set" />
            <TextInput id="reps_per_set" type="number" min="1" max="50" className="mt-1 block w-full" {...form.bind('repsPerSet')} />
            <InputError messages={errors.repsPerSet} className="mt-2" />
          </div>
        </div>

        <p className="text-xs text-muted">
          {holdSeconds
            ? `The ${form.values.durationMinutes} minute session is split into ${form.values.sets} × ${form.values.repsPerSet} timed holds of about ${holdSeconds}s each. The session ends automatically after the last rep.`
            : 'The session is split into timed holds. Set the duration, sets and reps per set so the app knows when the last rep ends.'}
        </p>

        <div>
          <InputLabel htmlFor="description" value="Short description" />
          <textarea
            id="description"
            rows={3}
            maxLength={500}
            className={`mt-1 ${TEXTAREA_CLASSES}`}
            placeholder="One or two sentences about what this stretch helps with."
            {...form.bind('description')}
          />
          <InputError messages={errors.description} className="mt-2" />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 space-y-6">
        <h2 className="text-xl font-black italic tracking-tighter">How to do it</h2>

        <div>
          <InputLabel htmlFor="instructions" value="Instructions" />
          <p className="text-xs text-muted">Put each step on its own line. They will be shown as a numbered list.</p>
          <textarea
            id="instructions"
            rows={6}
            maxLength={2000}
            className={`mt-1 ${TEXTAREA_CLASSES}`}
            placeholder={'Sit tall on a chair.\nTurn your upper body to the right.\nHold for 20 seconds, then switch sides.'}
            {...form.bind('instructions')}
          />
          <InputError messages={errors.instructions} className="mt-2" />
        </div>

        <fieldset>
          <legend className="block font-medium text-sm text-ink">Benefits</legend>
          <p className="text-xs text-muted">Between one and five short benefits. Leave unused boxes empty.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {form.values.benefits.map((benefit, index) => (
              <div key={index}>
                <label htmlFor={`benefit_${index}`} className="sr-only">
                  Benefit {index + 1}
                </label>
                <TextInput
                  id={`benefit_${index}`}
                  name="benefits[]"
                  type="text"
                  maxLength={80}
                  className="block w-full"
                  placeholder={`Benefit ${index + 1}`}
                  value={benefit}
                  onChange={(event) => setBenefit(index, event.target.value)}
                />
                <InputError messages={errors[`benefits.${index}`]} className="mt-1" />
              </div>
            ))}
          </div>
          <InputError messages={errors.benefits} className="mt-2" />
        </fieldset>

        <div>
          <InputLabel htmlFor="precautions" value="Precautions (optional)" />
          <textarea
            id="precautions"
            rows={2}
            maxLength={300}
            className={`mt-1 ${TEXTAREA_CLASSES}`}
            placeholder="e.g. Stop if you feel sharp pain."
            {...form.bind('precautions')}
          />
          <InputError messages={errors.precautions} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="video_url" value="Demo video URL (optional)" />
          <TextInput
            id="video_url"
            type="text"
            maxLength={255}
            className="mt-1 block w-full"
            placeholder="https://… or /videos/stretch.mp4"
            {...form.bind('videoUrl')}
          />
          <InputError messages={errors.videoUrl} className="mt-2" />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          to={cancelTo}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line bg-white text-sm font-bold hover:border-ink"
        >
          Cancel
        </Link>
        <PrimaryButton disabled={form.processing}>{submitLabel}</PrimaryButton>
      </div>
    </form>
  )
}
