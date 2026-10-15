import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DangerButton, InputError, InputLabel, PrimaryButton, SecondaryButton, TextInput } from '../components/forms.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { api } from '../lib/api.js'
import { useForm } from '../lib/hooks.js'

const header = <h2 className="font-semibold text-xl text-ink leading-tight">Profile</h2>

// "Saved." disappears after two seconds, like the Alpine snippet in the Blade partials.
// Render it with a new `key` each time to show it again.
function SavedNote() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return visible ? <p className="text-sm text-muted">Saved.</p> : null
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
    <section>
      <header>
        <h2 className="text-xl text-ink font-black italic tracking-tighter">Profile Information</h2>
        <p className="mt-1 text-sm text-muted">Update your account&apos;s profile information and email address.</p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <InputLabel htmlFor="name" value="Name" />
          <TextInput id="name" type="text" className="mt-1 block w-full" required autoFocus autoComplete="name" {...form.bind('name')} />
          <InputError className="mt-2" messages={form.errors.name} />
        </div>

        <div>
          <InputLabel htmlFor="email" value="Email" />
          <TextInput id="email" type="email" className="mt-1 block w-full" required autoComplete="username" {...form.bind('email')} />
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
    <section>
      <header>
        <h2 className="text-xl text-ink font-black italic tracking-tighter">Update Password</h2>
        <p className="mt-1 text-sm text-muted">Ensure your account is using a long, random password to stay secure.</p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <InputLabel htmlFor="update_password_current_password" value="Current Password" />
          <TextInput
            id="update_password_current_password"
            type="password"
            className="mt-1 block w-full"
            autoComplete="current-password"
            {...form.bind('currentPassword')}
          />
          <InputError messages={form.errors.currentPassword} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="update_password_password" value="New Password" />
          <TextInput id="update_password_password" type="password" className="mt-1 block w-full" autoComplete="new-password" {...form.bind('password')} />
          <InputError messages={form.errors.password} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="update_password_password_confirmation" value="Confirm Password" />
          <TextInput
            id="update_password_password_confirmation"
            type="password"
            className="mt-1 block w-full"
            autoComplete="new-password"
            {...form.bind('passwordConfirmation')}
          />
          <InputError messages={form.errors.passwordConfirmation} className="mt-2" />
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
    <section className="space-y-6">
      <header>
        <h2 className="text-xl text-ink font-black italic tracking-tighter">Delete Account</h2>
        <p className="mt-1 text-sm text-muted">
          Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please
          download any data or information that you wish to retain.
        </p>
      </header>

      <DangerButton type="button" onClick={() => setOpen(true)}>
        Delete Account
      </DangerButton>

      <Modal show={open} onClose={close} maxWidth="2xl">
        <form onSubmit={submit} className="p-6">
          <h2 className="text-xl text-ink font-black italic tracking-tighter">Are you sure you want to delete your account?</h2>

          <p className="mt-1 text-sm text-muted">
            Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm
            you would like to permanently delete your account.
          </p>

          <div className="mt-6">
            <InputLabel htmlFor="delete_password" value="Password" className="sr-only" />
            <TextInput
              id="delete_password"
              type="password"
              className="mt-1 block w-3/4"
              placeholder="Password"
              autoComplete="current-password"
              {...form.bind('password')}
            />
            <InputError messages={form.errors.password} className="mt-2" />
            <InputError messages={form.errors._form} className="mt-2" />
          </div>

          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={close}>Cancel</SecondaryButton>
            <DangerButton className="ms-3" disabled={form.processing}>
              Delete Account
            </DangerButton>
          </div>
        </form>
      </Modal>
    </section>
  )
}

export default function Profile() {
  return (
    <AppLayout title="Profile" header={header}>
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {[ProfileInformation, UpdatePassword, DeleteAccount].map((Section) => (
            <div key={Section.name} className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
              <div className="max-w-xl">
                <Section />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
