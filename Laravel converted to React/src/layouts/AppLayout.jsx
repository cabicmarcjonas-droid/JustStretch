import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Flash from '../components/Flash.jsx'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../lib/hooks.js'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/exercises', label: 'Exercises' },
  { to: '/sessions', label: 'My Sessions' },
]

const desktopLink = ({ isActive }) =>
  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 focus:outline-none transition duration-150 ease-in-out ${
    isActive
      ? 'border-accent text-ink focus:border-accent-dark'
      : 'border-transparent text-muted hover:text-ink hover:border-line focus:text-ink focus:border-line'
  }`

const mobileLink = ({ isActive }) =>
  `block w-full ps-3 pe-4 py-2 border-l-4 text-start text-base font-medium focus:outline-none transition duration-150 ease-in-out ${
    isActive
      ? 'border-accent text-accent-dark bg-accent-soft focus:text-accent-dark focus:bg-accent-soft focus:border-accent-dark'
      : 'border-transparent text-muted hover:text-ink hover:bg-paper hover:border-line focus:text-ink focus:bg-paper focus:border-line'
  }`

const menuItem =
  'block w-full px-4 py-2 text-start text-sm leading-5 text-ink hover:bg-paper focus:outline-none focus:bg-paper transition duration-150 ease-in-out'

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-full text-muted bg-white hover:text-ink focus:outline-none transition ease-in-out duration-150"
      >
        <div>{user.name}</div>
        <div className="ms-1">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg end-0 origin-top-right" role="menu" onClick={() => setOpen(false)}>
          <div className="rounded-md ring-1 ring-line py-1 bg-white">
            <Link to="/profile" className={menuItem} role="menuitem">
              Profile
            </Link>
            <button type="button" onClick={onLogout} className={menuItem} role="menuitem">
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout({ title, header, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  usePageTitle(title)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <Link to="/dashboard" className="flex items-center gap-2.5">
                  <Logo className="block h-8 w-8 text-accent" />
                  <span className="font-display text-lg font-semibold text-ink hidden lg:inline">Just Stretch</span>
                </Link>
              </div>

              <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                {LINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} className={desktopLink}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="hidden sm:flex sm:items-center sm:ms-6">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>

            <div className="-me-2 flex items-center sm:hidden">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-ink hover:bg-paper focus:outline-none focus:bg-paper focus:text-ink transition duration-150 ease-in-out"
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
          </div>
        </div>

        {open && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={mobileLink}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="pt-4 pb-1 border-t border-line">
              <div className="px-4">
                <div className="font-medium text-base text-ink">{user.name}</div>
                <div className="font-medium text-sm text-muted">{user.email}</div>
              </div>

              <div className="mt-3 space-y-1">
                <NavLink to="/profile" className={mobileLink}>
                  Profile
                </NavLink>
                <button type="button" onClick={handleLogout} className={mobileLink({ isActive: false })}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {header && (
        <header className="bg-white border-b border-line">
          <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{header}</div>
        </header>
      )}

      <Flash />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted">
          Just Stretch is a guide, not a diagnosis. Stop any stretch that causes sharp pain and consult a professional.
        </div>
      </footer>
    </div>
  )
}
