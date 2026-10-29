import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InputError, InputLabel, PrimaryButton, TextInput } from '../components/forms.jsx'
import Icon from '../components/Icon.jsx'
import { Wordmark } from '../components/Mark.jsx'
import { api } from '../lib/api.js'
import { useForm, usePageTitle } from '../lib/hooks.js'
import { card, link } from '../lib/ui.js'

export default function ForgotPassword() {
  usePageTitle('Forgot password')
  const form = useForm({ email: '' })
  const [sent, setSent] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      await api.post('/auth/forgot-password', values)
      setSent(true)
    })
  }

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8">
      <div className={`${card} w-full max-w-[440px] p-6 sm:p-8`}>
        <Wordmark />
        <span className="mt-8 flex h-11 w-11 items-center justify-center rounded-md bg-accent-soft text-accent">
          <Icon name="mail" className="h-5 w-5" />
        </span>

        {sent ? (
          <>
            <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.02em]">Check your email</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              If an account exists for that address, we sent a link to reset your password. The link expires in one hour.
            </p>
            <Link to="/login" className={`${link} mt-6 inline-block text-sm`}>
              Back to log in
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.02em]">Reset your password</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Enter the email you use for Just Stretch and we will send you a reset link.
            </p>

            <form onSubmit={submit} noValidate className="mt-6 space-y-5">
              <div>
                <InputLabel htmlFor="forgot_email" value="Email" />
                <TextInput
                  id="forgot_email"
                  type="email"
                  className="mt-1.5"
                  autoComplete="username"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  {...form.bind('email')}
                />
                <InputError messages={form.errors.email} className="mt-2" />
              </div>

              <InputError messages={form.errors._form} />
              <PrimaryButton className="w-full" size="lg" disabled={form.processing}>
                Send reset link
              </PrimaryButton>
            </form>

            <Link to="/login" className={`${link} mt-5 inline-block text-sm`}>
              Back to log in
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
