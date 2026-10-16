import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useForm, usePageTitle } from '../lib/hooks.js'
import '../css/LoginPage.css'

const CardBackground = ({ activeView }) => <div className={`card-bg ${activeView === 'login' ? 'login' : ''}`} />

const HeroPanel = ({ type, activeView, title, text, buttonText, onToggle }) => (
  <div className={`hero ${type} ${activeView === type ? 'active' : ''}`} inert={activeView !== type}>
    <h2>{title}</h2>
    <p>{text}</p>
    <button type="button" onClick={onToggle}>
      {buttonText}
    </button>
  </div>
)

const FieldError = ({ messages }) =>
  messages?.length ? (
    <p className="field-error" role="alert">
      {messages[0]}
    </p>
  ) : null

// Both forms post to the real API. On success AuthContext holds the user and <GuestOnly>
// sends them on to the page they were after (or the dashboard).
const RegisterForm = ({ activeView, onToggle }) => {
  const { register } = useAuth()
  const form = useForm({ name: '', email: '', password: '', passwordConfirmation: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit((values) => register(values))
  }

  return (
    <div className={`form register ${activeView === 'register' ? 'active' : ''}`} inert={activeView !== 'register'}>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <input type="text" placeholder="Full name" autoComplete="name" required aria-label="Full name" {...form.bind('name')} />
          <FieldError messages={form.errors.name} />
        </div>
        <div className="field">
          <input type="email" placeholder="Email address" autoComplete="username" required aria-label="Email address" {...form.bind('email')} />
          <FieldError messages={form.errors.email} />
        </div>
        <div className="field">
          <input type="password" placeholder="Password" autoComplete="new-password" required aria-label="Password" {...form.bind('password')} />
          <FieldError messages={form.errors.password} />
        </div>
        <div className="field">
          <input
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            required
            aria-label="Confirm password"
            {...form.bind('passwordConfirmation')}
          />
          <FieldError messages={form.errors.passwordConfirmation} />
        </div>
        <FieldError messages={form.errors._form} />
        <button type="submit" disabled={form.processing}>
          SIGN UP
        </button>
      </form>

      <button type="button" className="switch-link" onClick={onToggle}>
        Already have an account? Login
      </button>
    </div>
  )
}

const LoginForm = ({ activeView, onToggle }) => {
  const { login } = useAuth()
  const form = useForm({ email: '', password: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit((values) => login(values))
  }

  return (
    <div className={`form login ${activeView === 'login' ? 'active' : ''}`} inert={activeView !== 'login'}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <input type="email" placeholder="Email" autoComplete="username" required aria-label="Email" {...form.bind('email')} />
          <FieldError messages={form.errors.email} />
        </div>
        <div className="field">
          <input type="password" placeholder="Password" autoComplete="current-password" required aria-label="Password" {...form.bind('password')} />
          <FieldError messages={form.errors.password} />
        </div>
        <FieldError messages={form.errors._form} />
        {/* Password reset needs a mail setup; see PARKED.md. */}
        <span className="forgot" title="Coming soon" aria-disabled="true">
          Forgot password?
        </span>
        <button type="submit" disabled={form.processing}>
          LOGIN
        </button>
      </form>

      <button type="button" className="switch-link" onClick={onToggle}>
        New here? Sign up
      </button>
    </div>
  )
}

// /login and /register share this page; the card slides between the two views.
const LoginPage = ({ initialView = 'login' }) => {
  const [activeView, setActiveView] = useState(initialView)
  usePageTitle(activeView === 'login' ? 'Log in' : 'Sign up')

  const toggleView = () => setActiveView(activeView === 'login' ? 'register' : 'login')

  return (
    <section className="login-page">
      <div className="login-shell">
        <div className="login-card">
          <CardBackground activeView={activeView} />
          <HeroPanel
            type="register"
            activeView={activeView}
            title="Welcome back"
            text="Already have an account? Sign in to continue your routine."
            buttonText="LOGIN"
            onToggle={toggleView}
          />
          <RegisterForm activeView={activeView} onToggle={toggleView} />
          <LoginForm activeView={activeView} onToggle={toggleView} />
          <HeroPanel
            type="login"
            activeView={activeView}
            title="New here?"
            text="Create an account and start your first stretch today."
            buttonText="SIGN UP"
            onToggle={toggleView}
          />
        </div>
        <Link to="/" className="text-sm font-bold text-slate-500 transition-colors hover:text-emerald-600">
          &larr; Back to home
        </Link>
      </div>
    </section>
  )
}

export default LoginPage
