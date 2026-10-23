import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InputError, InputLabel, PrimaryButton, TextInput } from '../components/forms.jsx'
import Icon from '../components/Icon.jsx'
import { areaOptions, difficultyOptions, instructionSteps } from '../lib/enums.js'
import { plural } from '../lib/format.js'
import { useForm } from '../lib/hooks.js'
import { btn, card, cardHead, sectionTitle, select, textarea } from '../lib/ui.js'

const AREAS = Object.entries(areaOptions())
const DIFFICULTIES = Object.entries(difficultyOptions())
const MAX_BENEFITS = 5
const MAX_STEPS = 12

const hint = 'mt-0.5 text-[13px] text-muted'
const iconButton =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:border-danger-line hover:bg-danger-soft hover:text-danger disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-muted'
const alertBox = 'rounded-md border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger'

// Numbered form section: grey head with the number and title, fields below.
function Section({ n, title, note, children }) {
  return (
    <section className={`${card} overflow-hidden`}>
      <div className={`${cardHead} flex items-baseline gap-3`}>
        <span className="font-mono text-xs font-medium text-accent">{n}</span>
        <h2 className={sectionTitle}>{title}</h2>
        {note && <span className="ms-auto hidden text-[13px] text-muted sm:inline">{note}</span>}
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  )
}

// Shared by the create and edit pages. Steps are edited one per input and sent to the API
// joined by newlines, the same `instructions` string it has always stored.
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
    benefits: exercise?.benefits ?? [],
    precautions: exercise?.precautions ?? '',
    videoUrl: exercise?.videoUrl ?? '',
  })
  const { errors, setField } = form

  // The session is split evenly into timed holds, so this hint shows what each
  // rep will last. Blank/invalid values simply hide it.
  const holdSeconds = (() => {
    const minutes = Number(form.values.durationMinutes)
    const sets = Number(form.values.sets)
    const reps = Number(form.values.repsPerSet)
    if (!minutes || !sets || !reps) return null
    return Math.max(1, Math.round((minutes * 60) / (sets * reps)))
  })()

  // Local list so a blank step can exist while it is being typed.
  const [steps, setSteps] = useState(() => {
    const existing = instructionSteps(exercise?.instructions)
    return existing.length > 0 ? existing : ['']
  })
  const updateSteps = (next) => {
    setSteps(next)
    setField('instructions', next.map((s) => s.trim()).filter(Boolean).join('\n'))
  }

  const [benefitDraft, setBenefitDraft] = useState('')
  const benefits = form.values.benefits
  const addBenefit = () => {
    const value = benefitDraft.trim()
    if (!value || benefits.length >= MAX_BENEFITS || benefits.includes(value)) return
    setField('benefits', [...benefits, value])
    setBenefitDraft('')
  }

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
  const benefitErrors = Object.entries(errors)
    .filter(([key]) => key === 'benefits' || key.startsWith('benefits.'))
    .flatMap(([, messages]) => messages)

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errorCount > 0 && (
        <div className={alertBox} role="alert">
          Please fix the {plural('field', errorCount)} highlighted below.
        </div>
      )}
      {errors._form && (
        <div className={alertBox} role="alert">
          {errors._form[0]}
        </div>
      )}

      <Section n="01" title="Basics">

        <div>
          <InputLabel htmlFor="title" value="Title" />
          <TextInput id="title" type="text" className="mt-1.5" maxLength={120} placeholder="e.g. Seated Spinal Twist" {...form.bind('title')} />
          <InputError messages={errors.title} className="mt-2" />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <InputLabel htmlFor="target_area" value="Target area" />
            <select id="target_area" className={`mt-1.5 ${select}`} {...form.bind('targetArea')}>
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
            <select id="difficulty" className={`mt-1.5 ${select}`} {...form.bind('difficulty')}>
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
            <TextInput id="duration_minutes" type="number" min="1" max="30" className="mt-1.5" {...form.bind('durationMinutes')} />
            <InputError messages={errors.durationMinutes} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="sets" value="Sets" />
            <TextInput id="sets" type="number" min="1" max="20" className="mt-1.5" {...form.bind('sets')} />
            <InputError messages={errors.sets} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="reps_per_set" value="Reps per set" />
            <TextInput id="reps_per_set" type="number" min="1" max="50" className="mt-1.5" {...form.bind('repsPerSet')} />
            <InputError messages={errors.repsPerSet} className="mt-2" />
          </div>
        </div>

        <p className={hint}>
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
            className={`mt-1.5 ${textarea}`}
            placeholder="One or two sentences about what this stretch helps with."
            {...form.bind('description')}
          />
          <InputError messages={errors.description} className="mt-2" />
        </div>
      </Section>

      <Section n="02" title="Steps" note="One instruction per step">
        <fieldset>
          <legend className="sr-only">Steps</legend>
          <ol className="mt-3 space-y-2.5">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center gap-2.5">
                <span className="w-6 shrink-0 font-mono text-sm font-medium text-accent">{String(index + 1).padStart(2, '0')}</span>
                <label htmlFor={`step_${index}`} className="sr-only">
                  Step {index + 1}
                </label>
                <TextInput
                  id={`step_${index}`}
                  type="text"
                  maxLength={300}
                  placeholder={index === 0 ? 'e.g. Sit tall on a chair.' : `Step ${index + 1}`}
                  value={step}
                  onChange={(event) => updateSteps(steps.map((s, i) => (i === index ? event.target.value : s)))}
                />
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => updateSteps(steps.filter((_, i) => i !== index))}
                  disabled={steps.length === 1}
                  aria-label={`Remove step ${index + 1}`}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
          {steps.length < MAX_STEPS && (
            <button type="button" className={`${btn.ghost} ${btn.md} mt-3`} onClick={() => updateSteps([...steps, ''])}>
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
              Add step
            </button>
          )}
          <InputError messages={errors.instructions} className="mt-2" />
        </fieldset>
      </Section>

      <Section n="03" title="Benefits" note="One to five short benefits">
        <fieldset>
          <legend className="sr-only">Benefits</legend>
          {benefits.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="inline-flex items-center gap-1 rounded-md border border-accent-mid bg-accent-soft py-1 pe-1 ps-3 text-sm font-medium text-accent-dark"
                >
                  {benefit}
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-accent-mid/40"
                    onClick={() => setField('benefits', benefits.filter((b) => b !== benefit))}
                    aria-label={`Remove ${benefit}`}
                  >
                    <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {benefits.length < MAX_BENEFITS && (
            <div className="mt-3 flex gap-2">
              <label htmlFor="benefit_new" className="sr-only">
                New benefit
              </label>
              <TextInput
                id="benefit_new"
                type="text"
                maxLength={80}
                placeholder="e.g. Eases neck tension"
                value={benefitDraft}
                onChange={(event) => setBenefitDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addBenefit()
                  }
                }}
              />
              <button type="button" className={`${btn.secondary} h-11 shrink-0 px-4 text-sm`} onClick={addBenefit} disabled={!benefitDraft.trim()}>
                Add
              </button>
            </div>
          )}
          <InputError messages={benefitErrors} className="mt-2" />
        </fieldset>
      </Section>

      <Section n="04" title="Safety and video">

        <div>
          <InputLabel htmlFor="precautions" value="Precautions (optional)" />
          <textarea
            id="precautions"
            rows={2}
            maxLength={300}
            className={`mt-1.5 ${textarea}`}
            placeholder="e.g. Stop if you feel sharp pain."
            {...form.bind('precautions')}
          />
          <InputError messages={errors.precautions} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="video_url" value="Demo video URL (optional)" />
          <TextInput id="video_url" type="text" maxLength={255} className="mt-1.5" placeholder="https://… or /videos/stretch.mp4" {...form.bind('videoUrl')} />
          <p className={`${hint} mt-2`}>Stretches using one of the bundled /videos files get a live score; others are self-rated.</p>
          <InputError messages={errors.videoUrl} className="mt-2" />
        </div>
      </Section>

      <div className={`${card} flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-end`}>
        <p className="text-[13px] text-muted sm:me-auto">Only you can edit or remove this exercise later.</p>
        <Link to={cancelTo} className={`${btn.secondary} ${btn.md}`}>
          Cancel
        </Link>
        <PrimaryButton disabled={form.processing}>{submitLabel}</PrimaryButton>
      </div>
    </form>
  )
}
