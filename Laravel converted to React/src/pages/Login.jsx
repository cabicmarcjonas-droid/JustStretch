import { InputError, InputLabel, PrimaryButton, TextInput } from '../components/forms.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import GuestLayout from '../layouts/GuestLayout.jsx'
import { useForm } from '../lib/hooks.js'

export default function Login() {
  const { login } = useAuth()
  const form = useForm({ email: '', password: '', remember: false })

  // On success AuthContext sets the user and <GuestOnly> redirects to the intended page.
  const onSubmit = (event) => {
    event.preventDefault()
    form.submit((values) => login(values))
  }

  return (
    <GuestLayout>
      <form onSubmit={onSubmit}>
        {/* Email Address */}
        <div>
          <InputLabel htmlFor="email" value="Email" />
          <TextInput
            id="email"
            className="block mt-1 w-full"
            type="email"
            required
            autoFocus
            autoComplete="username"
            {...form.bind('email')}
          />
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
            autoComplete="current-password"
            {...form.bind('password')}
          />
          <InputError messages={form.errors.password} className="mt-2" />
        </div>

        {/* Remember Me */}
        <div className="block mt-4">
          <label htmlFor="remember_me" className="inline-flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              className="rounded border-line text-accent shadow-sm focus:ring-accent"
              checked={form.values.remember}
              onChange={(event) => form.setField('remember', event.target.checked)}
            />
            <span className="ms-2 text-sm text-muted">Remember me</span>
          </label>
        </div>

        <InputError messages={form.errors._form} className="mt-4" />

        <div className="flex items-center justify-end mt-4">
          {/* Password reset needs a mail setup; see PARKED.md. */}
          <span
            title="Coming soon"
            aria-disabled="true"
            className="underline text-sm text-muted/60 cursor-not-allowed rounded-md"
          >
            Forgot your password?
          </span>

          <PrimaryButton className="ms-3" disabled={form.processing}>
            Log in
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  )
}
