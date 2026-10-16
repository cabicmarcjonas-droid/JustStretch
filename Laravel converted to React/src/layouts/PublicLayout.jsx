import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../lib/hooks.js'

const pill = 'inline-flex items-center px-4 py-2 rounded-full bg-ink text-white font-medium hover:bg-ink/85'

export default function PublicLayout({ title, children }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  usePageTitle(title)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="w-8 h-8 text-accent" />
            <span className="font-display text-xl font-semibold">Just Stretch</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink')}>
              About
            </NavLink>
            {user ? (
              <Link to="/dashboard" className={pill}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-muted hover:text-ink">
                  Log in
                </Link>
                <Link to="/register" className={pill}>
                  Register
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="sm:hidden p-2 -me-2 rounded-md text-muted hover:text-ink"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="sm:hidden border-t border-line px-4 py-3 space-y-1 text-sm">
            <Link to="/about" className="block py-2 text-ink">
              About
            </Link>
            {user ? (
              <Link to="/dashboard" className="block py-2 text-ink">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-ink">
                  Log in
                </Link>
                <Link to="/register" className="block py-2 text-accent font-medium">
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6 text-accent" />
              <span className="font-display font-semibold">Just Stretch</span>
            </div>
            <p className="mt-2 text-muted">Guided stretching for everyday aches, right in your browser.</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Explore</p>
            <Link to="/" className="block text-muted hover:text-ink">
              Home
            </Link>
            <Link to="/about" className="block text-muted hover:text-ink">
              About
            </Link>
            {!user && (
              <Link to="/register" className="block text-muted hover:text-ink">
                Create an account
              </Link>
            )}
          </div>
          <p className="text-muted sm:text-right">Not a substitute for medical advice.</p>
        </div>
      </footer>
    </div>
  )
}
