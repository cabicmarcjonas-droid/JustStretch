import { Link } from 'react-router-dom'
import { InputError, InputLabel, PrimaryButton, TextInput } from '../components/forms.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import GuestLayout from '../layouts/GuestLayout.jsx'
import { useForm } from '../lib/hooks.js'

export default function Register() {
  const { register } = useAuth()
  const form = useForm({ name: '', email: '', password: '', passwordConfirmation: '' })

  const onSubmit = (event) => {
    event.preventDefault()
    form.submit((values) => register(values))
  }

  return (
    <GuestLayout>
      <form onSubmit={onSubmit}>
        {/* Name */}
        <div>
          <InputLabel htmlFor="name" value="Name" />
          <TextInput id="name" className="block mt-1 w-full" type="text" required autoFocus autoComplete="name" {...form.bind('name')} />
          <InputError messages={form.errors.name} className="mt-2" />
        </div>

        {/* Email Address */}
        <div className="mt-4">
          <InputLabel htmlFor="email" value="Email" />
          <TextInput id="email" className="block mt-1 w-full" type="email" required autoComplete="username" {...form.bind('email')} />
          <InputError messages={form.errors.email} className="mt-2" />
        </div>

        {/* Password */}
        <div className="mt-4">
          <InputLabel htmlFor="password" value="Password" />
          <TextInput
            id="password"
            className="block mt-1 w-full"
            type="password"
            required
            autoComplete="new-password"
            {...form.bind('password')}
          />
          <InputError messages={form.errors.password} className="mt-2" />
        </div>

        {/* Confirm Password */}
        <div className="mt-4">
          <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
          <TextInput
            id="password_confirmation"
            className="block mt-1 w-full"
            type="password"
            required
            autoComplete="new-password"
            {...form.bind('passwordConfirmation')}
          />
          <InputError messages={form.errors.passwordConfirmation} className="mt-2" />
        </div>

        <InputError messages={form.errors._form} className="mt-4" />

        <div className="flex items-center justify-end mt-4">
          <Link
            to="/login"
            className="underline text-sm text-muted hover:text-ink rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            Already registered?
          </Link>

          <PrimaryButton className="ms-4" disabled={form.processing}>
            Register
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  )
}
