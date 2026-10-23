import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useForm, usePageTitle } from '../lib/hooks.js'
import { btn, input, label } from '../lib/ui.js'

// The brand panel slides over the form you are not using. Faster than the old 500ms
// ease-in-out, with an iOS-style drawer curve; reduced-motion users get no slide.
const SLIDE = 'transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none'
const FADE = 'transition-opacity duration-300 motion-reduce:transition-none'

const FieldError = ({ messages }) =>
  messages?.length ? (
    <p className="text-xs font-bold text-red-700" role="alert">
      {messages[0]}
    </p>
  ) : null

function Field({ id, labelText, hint, error, aside, ...props }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={label}>
          {labelText}
        </label>
        {aside}
      </div>
      <input id={id} className={input} {...props} />
      {hint && !error?.length && <p className="text-xs text-slate-500">{hint}</p>}
      <FieldError messages={error} />
    </div>
  )
}

function PasswordField({ id, ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <Field
      id={id}
      type={shown ? 'text' : 'password'}
      aside={
        <button type="button" onClick={() => setShown((v) => !v)} className="text-[13px] font-bold text-accent hover:text-accent-dark">
          {shown ? 'Hide' : 'Show'}
        </button>
      }
      {...props}
    />
  )
}

// Both forms post to the real API. On success AuthContext holds the user and <GuestOnly>
// sends them on to the page they were after (or the dashboard).
function RegisterForm({ active, onToggle }) {
  const { register } = useAuth()
  const form = useForm({ name: '', email: '', password: '', passwordConfirmation: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit((values) => register(values))
  }

  return (
    <div
      className={`${active ? 'flex' : 'hidden'} flex-col justify-center gap-5 px-6 py-10 sm:absolute sm:inset-y-0 sm:right-0 sm:flex sm:w-1/2 sm:px-12 ${FADE} ${
        active ? 'sm:opacity-100' : 'sm:pointer-events-none sm:opacity-0'
      }`}
      inert={!active}
    >
      <div>
        <p className="text-xl font-black italic tracking-tighter">JustStretch</p>
        <h1 className="mt-4 text-3xl font-black italic tracking-tighter">Create your account</h1>
        <p className="mt-1 text-[15px] text-slate-500">Free, and it takes under a minute.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id="register_name" labelText="Full name" type="text" autoComplete="name" required {...form.bind('name')} error={form.errors.name} />
        <Field
          id="register_email"
          labelText="Email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          required
          {...form.bind('email')}
          error={form.errors.email}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <PasswordField
            id="register_password"
            labelText="Password"
            autoComplete="new-password"
            hint="At least 8 characters"
            required
            {...form.bind('password')}
            error={form.errors.password}
          />
          <Field
            id="register_password_confirmation"
            labelText="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            {...form.bind('passwordConfirmation')}
            error={form.errors.passwordConfirmation}
          />
        </div>
        <FieldError messages={form.errors._form} />
        <button type="submit" disabled={form.processing} className={`${btn.primary} ${btn.lg} w-full`}>
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={onToggle} className="font-bold text-accent hover:text-accent-dark">
          Log in
        </button>
      </p>
    </div>
  )
}

function LoginForm({ active, onToggle }) {
  const { login } = useAuth()
  const form = useForm({ email: '', password: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit((values) => login(values))
  }

  return (
    <div
      className={`${active ? 'flex' : 'hidden'} flex-col justify-center gap-5 px-6 py-10 sm:absolute sm:inset-y-0 sm:left-0 sm:flex sm:w-1/2 sm:px-12 ${FADE} ${
        active ? 'sm:opacity-100' : 'sm:pointer-events-none sm:opacity-0'
      }`}
      inert={!active}
    >
      <div>
        <p className="text-xl font-black italic tracking-tighter">JustStretch</p>
        <h1 className="mt-4 text-3xl font-black italic tracking-tighter">Log in</h1>
        <p className="mt-1 text-[15px] text-slate-500">Welcome back. Pick up where you left off.</p>
      </div>

      {/* Password reset needs a mail setup (see PARKED.md), so there is no "Forgot password?" link. */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="login_email"
          labelText="Email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          required
          {...form.bind('email')}
          error={form.errors.email}
        />
        <PasswordField
          id="login_password"
          labelText="Password"
          autoComplete="current-password"
          required
          {...form.bind('password')}
          error={form.errors.password}
        />
        <FieldError messages={form.errors._form} />
        <button type="submit" disabled={form.processing} className={`${btn.primary} ${btn.lg} w-full`}>
          Log in
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        New here?{' '}
        <button type="button" onClick={onToggle} className="font-bold text-accent hover:text-accent-dark">
          Create an account
        </button>
      </p>
    </div>
  )
}

const BRAND = {
  login: {
    title: 'Your stretch streak is waiting.',
    points: ['Pick up your saved sessions and scores', 'See how your form trends week to week'],
    switchLabel: 'Create an account',
  },
  register: {
    title: 'Stretch better. Move better. Feel better.',
    points: ['Guided stretches with a 3D reference', 'Live feedback from your webcam', 'Your video never leaves your device'],
    switchLabel: 'I already have an account',
  },
}

// Green panel with a frame from a reference video. Sits over the inactive form (desktop only).
function BrandPanel({ view, onToggle }) {
  const content = BRAND[view]
  return (
    <div
      className={`absolute inset-y-0 left-0 z-10 hidden w-1/2 bg-accent sm:block ${SLIDE} ${view === 'login' ? 'translate-x-full' : 'translate-x-0'}`}
    >
      <div key={view} className="flex h-full flex-col justify-center gap-6 px-10 text-white">
        <div className="relative aspect-[340/220] overflow-hidden rounded-2xl bg-slate-200">
          <img src="/thumbs/neck_side_tilt.jpg" alt="" className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live form</span>
            <span className="text-lg font-black italic tracking-tighter text-accent">86</span>
          </span>
        </div>
        <h2 className="text-[26px] font-black italic leading-8 tracking-tighter">{content.title}</h2>
        <ul className="space-y-2.5">
          {content.points.map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-sm font-medium text-emerald-50">
              <Icon name="check" className="h-4 w-4 text-emerald-200" strokeWidth={2.6} />
              {point}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onToggle}
          className="self-start rounded-xl border-2 border-white/80 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-white hover:text-accent active:scale-[0.97]"
        >
          {content.switchLabel}
        </button>
      </div>
    </div>
  )
}

// /login and /register share this page; the green panel slides between the two views.
const LoginPage = ({ initialView = 'login' }) => {
  const [activeView, setActiveView] = useState(initialView)
  usePageTitle(activeView === 'login' ? 'Log in' : 'Sign up')

  const toggleView = () => setActiveView(activeView === 'login' ? 'register' : 'login')

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="relative w-full max-w-[880px] overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl sm:h-[620px]">
        <BrandPanel view={activeView} onToggle={toggleView} />
        <RegisterForm active={activeView === 'register'} onToggle={toggleView} />
        <LoginForm active={activeView === 'login'} onToggle={toggleView} />
      </div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-accent">
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back to home
      </Link>
    </section>
  )
}

export default LoginPage
