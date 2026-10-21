import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DangerButton, InputError, InputLabel, PrimaryButton, SecondaryButton, TextInput } from '../components/forms.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { initials } from '../lib/format.js'
import { useForm } from '../lib/hooks.js'
import { btn, card, container, pageTitle } from '../lib/ui.js'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'password', label: 'Password', icon: 'key' },
  { id: 'delete', label: 'Delete account', icon: 'trash' },
]

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
  const header = <h1 className={pageTitle}>Account settings</h1>

  return (
    <AppLayout title="Account settings" header={header}>
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
          <ProfileInformation />
          <UpdatePassword />
          <DeleteAccount />
        </div>
      </div>
    </AppLayout>
  )
}
