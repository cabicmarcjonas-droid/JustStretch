import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DangerButton, InputError, InputLabel, PrimaryButton, SecondaryButton, TextInput } from '../components/forms.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { PAIN_AREAS, areaLabel } from '../lib/enums.js'
import { initials } from '../lib/format.js'
import { useFetch, useForm } from '../lib/hooks.js'
import { btn, card, container, pageTitle } from '../lib/ui.js'

const SECTIONS = [
  { id: 'body', label: 'Body map', icon: 'body' },
  { id: 'flexibility', label: 'Flexibility', icon: 'chart' },
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'password', label: 'Password', icon: 'key' },
  { id: 'delete', label: 'Delete account', icon: 'trash' },
]

// The three flexibility tests, with the unit each one is measured in.
const TESTS = [
  { id: 'sit_and_reach', label: 'Sit and reach', unit: 'cm', min: 0, max: 200 },
  { id: 'neck_range', label: 'Neck range', unit: '1-5', min: 1, max: 5 },
  { id: 'shoulder_range', label: 'Shoulder range', unit: '1-5', min: 1, max: 5 },
]

// Where each area button sits on the silhouette, from the head down.
const AREA_POSITIONS = {
  neck: 'top-[12%]',
  shoulders: 'top-[16%]',
  upper_back: 'top-[30%]',
  lower_back: 'top-[43%]',
  hips: 'top-[57%]',
  quads: 'top-[72%]',
  hamstrings: 'top-[85%]',
}

// "Saved." disappears after two seconds. Render it with a new `key` each time to show it again.
function SavedNote() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return visible ? (
    <p className="inline-flex items-center gap-1.5 text-sm font-bold text-accent" role="status">
      <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
      Saved
    </p>
  ) : null
}

function SectionHeader({ title, children }) {
  return (
    <header>
      <h2 className="text-xl font-black italic tracking-tighter text-ink">{title}</h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{children}</p>
    </header>
  )
}

// A simple front-facing silhouette, so the buttons land on the part they name.
function BodySilhouette() {
  return (
    <svg viewBox="0 0 200 400" className="absolute inset-0 h-full w-full text-slate-200" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <circle cx="100" cy="26" r="18" />
        <rect x="92" y="42" width="16" height="14" rx="6" />
        <rect x="64" y="56" width="72" height="172" rx="26" />
        <rect x="40" y="62" width="18" height="150" rx="9" />
        <rect x="142" y="62" width="18" height="150" rx="9" />
        <rect x="70" y="224" width="26" height="158" rx="13" />
        <rect x="104" y="224" width="26" height="158" rx="13" />
      </g>
    </svg>
  )
}

const areaButton = (active) =>
  `absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${
    active ? 'border-accent bg-accent text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-accent hover:text-accent'
  }`

// The body map: tap an area to select it, tap it again to clear it.
function BodyMap({ painAreas, onToggle }) {
  return (
    <div className="relative mx-auto mt-6 aspect-[1/2] w-full max-w-[220px]">
      <BodySilhouette />
      {PAIN_AREAS.map((area) => (
        <button
          key={area}
          type="button"
          onClick={() => onToggle(area)}
          aria-pressed={painAreas.includes(area)}
          className={`${areaButton(painAreas.includes(area))} ${AREA_POSITIONS[area]}`}
        >
          {areaLabel(area)}
        </button>
      ))}
    </div>
  )
}

// The body map and the starting flexibility. One form, one Save button.
function BodyAndFlexibility() {
  const { data } = useFetch('/profile')

  // Remount the form once the saved values arrive, so it starts from them.
  return <BodyAndFlexibilityForm key={data?.user?.id ?? 'loading'} profile={data?.user} />
}

function BodyAndFlexibilityForm({ profile }) {
  const { setUser } = useAuth()
  const measurements = Object.fromEntries(
    (profile?.baseline?.measurements ?? [])
      .filter((measurement) => TESTS.some((test) => test.id === measurement.test))
      .map((measurement) => [measurement.test, measurement.value]),
  )
  const { bind, errors, processing, submit } = useForm({
    sit_and_reach: measurements.sit_and_reach ?? '',
    neck_range: measurements.neck_range ?? '',
    shoulder_range: measurements.shoulder_range ?? '',
  })
  const [painAreas, setPainAreas] = useState(() => profile?.painAreas ?? [])
  const [savedAt, setSavedAt] = useState(0)

  const toggle = (area) =>
    setPainAreas((current) => (current.includes(area) ? current.filter((value) => value !== area) : [...current, area]))

  const save = (event) => {
    event.preventDefault()
    submit(async (formValues) => {
      const measurements = TESTS.filter((test) => formValues[test.id] !== '')
        .map((test) => ({ test: test.id, value: Number(formValues[test.id]), unit: test.unit }))

      const { user } = await api.put('/profile', {
        painAreas,
        baseline: {
          assessedAt: measurements.length > 0 ? new Date().toISOString() : null,
          measurements,
        },
      })

      // Keep the rest of the app in step with the new body map.
      setUser(user)
      setSavedAt(Date.now())
    })
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section id="body" className={`${card} scroll-mt-24 p-6 sm:p-8`}>
        <SectionHeader title="Body map">
          Tap the areas where you feel pain. We use them to put the stretches that help you first in the library.
        </SectionHeader>
        <BodyMap painAreas={painAreas} onToggle={toggle} />
      </section>

      <section id="flexibility" className={`${card} scroll-mt-24 p-6 sm:p-8`}>
        <SectionHeader title="Starting flexibility">
          Your starting point, so later sessions can be compared against it. Leave a field empty if you have not measured it.
        </SectionHeader>

        <div className="mt-6 grid max-w-2xl gap-5 sm:grid-cols-3">
          {TESTS.map((test) => (
            <div key={test.id}>
              <InputLabel htmlFor={test.id} value={test.label} />
              <div className="relative mt-1.5">
                <TextInput
                  id={test.id}
                  type="number"
                  inputMode="numeric"
                  min={test.min}
                  max={test.max}
                  step={test.min === 1 ? 1 : 'any'}
                  className="pe-12"
                  {...bind(test.id)}
                />
                <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">{test.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <PrimaryButton disabled={processing}>Save</PrimaryButton>
        {savedAt > 0 && <SavedNote key={savedAt} />}
      </div>
      <InputError messages={errors._form} className="mt-2" />
    </form>
  )
}

function ProfileInformation() {
  const { user, setUser } = useAuth()
  const form = useForm({ name: user.name, email: user.email })
  const [savedAt, setSavedAt] = useState(0)

  const submit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      const { user: updated } = await api.patch('/profile', values)
      setUser(updated)
      setSavedAt(Date.now())
    })
  }

  return (
    <section id="profile" className={`${card} scroll-mt-24 p-6 sm:p-8`}>
      <SectionHeader title="Profile information">Update your name and the email address you log in with.</SectionHeader>

      <form onSubmit={submit} className="mt-6 max-w-xl space-y-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-black text-accent">
            {initials(form.values.name || user.name)}
          </span>
          <p className="text-sm text-slate-500">Your initials appear in the menu and on exercises you add.</p>
        </div>

        <div>
          <InputLabel htmlFor="name" value="Name" />
          <TextInput id="name" type="text" className="mt-1.5" required autoComplete="name" {...form.bind('name')} />
          <InputError className="mt-2" messages={form.errors.name} />
        </div>

        <div>
          <InputLabel htmlFor="email" value="Email" />
          <TextInput id="email" type="email" className="mt-1.5" required autoComplete="username" {...form.bind('email')} />
          <InputError className="mt-2" messages={form.errors.email} />
        </div>

        <InputError messages={form.errors._form} />

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.processing}>Save</PrimaryButton>
          {savedAt > 0 && <SavedNote key={savedAt} />}
        </div>
      </form>
    </section>
  )
}

function UpdatePassword() {
  const form = useForm({ currentPassword: '', password: '', passwordConfirmation: '' })
  const [savedAt, setSavedAt] = useState(0)

  const submit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      await api.put('/profile/password', values)
      form.setValues({ currentPassword: '', password: '', passwordConfirmation: '' })
      setSavedAt(Date.now())
    })
  }

  return (
    <section id="password" className={`${card} scroll-mt-24 p-6 sm:p-8`}>
      <SectionHeader title="Password">Use a long password you don&apos;t use anywhere else. At least 8 characters.</SectionHeader>

      <form onSubmit={submit} className="mt-6 max-w-xl space-y-5">
        <div>
          <InputLabel htmlFor="update_password_current_password" value="Current password" />
          <TextInput
            id="update_password_current_password"
            type="password"
            className="mt-1.5"
            autoComplete="current-password"
            {...form.bind('currentPassword')}
          />
          <InputError messages={form.errors.currentPassword} className="mt-2" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <InputLabel htmlFor="update_password_password" value="New password" />
            <TextInput id="update_password_password" type="password" className="mt-1.5" autoComplete="new-password" {...form.bind('password')} />
            <InputError messages={form.errors.password} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="update_password_password_confirmation" value="Confirm new password" />
            <TextInput
              id="update_password_password_confirmation"
              type="password"
              className="mt-1.5"
              autoComplete="new-password"
              {...form.bind('passwordConfirmation')}
            />
            <InputError messages={form.errors.passwordConfirmation} className="mt-2" />
          </div>
        </div>

        <InputError messages={form.errors._form} />

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.processing}>Update password</PrimaryButton>
          {savedAt > 0 && <SavedNote key={savedAt} />}
        </div>
      </form>
    </section>
  )
}

function DeleteAccount() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const form = useForm({ password: '' })
  const [open, setOpen] = useState(false)

  const close = () => {
    setOpen(false)
    form.setErrors({})
    form.setField('password', '')
  }

  const submit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      await api.delete('/profile', values)
      navigate('/')
      setUser(null)
    })
  }

  return (
    <section id="delete" className="scroll-mt-24 rounded-2xl border border-red-200 bg-white p-6 shadow-card sm:p-8">
      <SectionHeader title="Delete account">
        This permanently removes your account, your session history and every exercise you added to the library (along with other
        members&apos; sessions on those exercises).
      </SectionHeader>

      <button type="button" onClick={() => setOpen(true)} className={`${btn.dangerOutline} ${btn.md} mt-6`}>
        Delete account
      </button>

      <Modal show={open} onClose={close} maxWidth="lg">
        <form onSubmit={submit} className="p-6 sm:p-7">
          <h2 className="text-xl font-black italic tracking-tighter text-ink">Delete your account?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">This cannot be undone. Enter your password to confirm.</p>

          <div className="mt-5">
            <InputLabel htmlFor="delete_password" value="Password" />
            <TextInput id="delete_password" type="password" className="mt-1.5" autoComplete="current-password" {...form.bind('password')} />
            <InputError messages={form.errors.password} className="mt-2" />
            <InputError messages={form.errors._form} className="mt-2" />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton onClick={close}>Cancel</SecondaryButton>
            <DangerButton disabled={form.processing}>Delete account</DangerButton>
          </div>
        </form>
      </Modal>
    </section>
  )
}

export default function Profile() {
  const header = <h1 className={pageTitle}>Profile</h1>

  return (
    <AppLayout title="Profile" header={header}>
      <div className={`${container} grid gap-8 pb-16 pt-6 lg:grid-cols-[220px_1fr]`}>
        <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-accent"
                >
                  <Icon name={section.icon} className="h-4 w-4" />
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-6">
          <BodyAndFlexibility />
          <ProfileInformation />
          <UpdatePassword />
          <DeleteAccount />
        </div>
      </div>
    </AppLayout>
  )
}
