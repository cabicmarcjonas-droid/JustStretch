import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Flash from '../components/Flash.jsx'
import Icon from '../components/Icon.jsx'
import { Wordmark } from '../components/Mark.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { initials } from '../lib/format.js'
import { usePageTitle } from '../lib/hooks.js'
import { appMain } from '../lib/ui.js'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/exercises', label: 'Exercises', icon: 'list' },
  { to: '/sessions', label: 'My sessions', icon: 'clock' },
  { to: '/profile', label: 'Profile', icon: 'user' },
]

const itemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors ${
    isActive ? 'bg-accent-soft font-semibold text-accent-dark' : 'font-medium text-ink-2 hover:bg-paper-2 hover:text-ink'
  }`

function NavLinks({ onNavigate }) {
  return (
    <ul className="space-y-1">
      {LINKS.map((link) => (
        <li key={link.to}>
          <NavLink to={link.to} end={link.end} className={itemClass} onClick={onNavigate}>
            {({ isActive }) => (
              <>
                <Icon name={link.icon} className={`h-[18px] w-[18px] ${isActive ? 'text-accent-dark' : 'text-ink-2'}`} />
                {link.label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function Account({ user, onLogout }) {
  return (
    <div className="flex items-center gap-3 border-t border-line px-2 pt-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-xs font-semibold text-ink-2">
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
        <button type="button" onClick={onLogout} className="-ms-1 inline-flex h-8 items-center rounded-md px-1 text-[13px] text-muted hover:text-ink active:text-ink focus-visible:outline-2 focus-visible:outline-accent">
          Log out
        </button>
      </div>
    </div>
  )
}

// Signed-in pages: a side rail on desktop (N3), a top bar with a drawer on phones.
// `header` renders above the flash message and the page body.
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
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-4 pb-4 pt-5 lg:flex">
        <Link to="/dashboard" className="mb-6 px-2">
          <Wordmark size="sm" />
        </Link>
        <nav aria-label="Main" className="flex-1">
          <NavLinks />
        </nav>
        <Account user={user} onLogout={handleLogout} />
      </aside>

      <div className="sticky top-0 z-40 border-b border-line bg-surface lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/dashboard">
            <Wordmark size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-me-2 rounded-md p-2 text-ink-2 hover:bg-paper-2"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <Icon name={open ? 'x' : 'menu'} className="h-6 w-6" />
          </button>
        </div>
        {open && (
          <nav aria-label="Main" className="space-y-3 border-t border-line px-3 pb-3 pt-2">
            <NavLinks onNavigate={() => setOpen(false)} />
            <Account user={user} onLogout={handleLogout} />
          </nav>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={`${appMain} flex-1`}>
          {header && <header className="mb-6">{header}</header>}
          <Flash />
          <main>{children}</main>
        </div>
        <footer className="flex flex-col gap-1 border-t border-line px-4 py-4 text-xs text-muted sm:flex-row sm:justify-between sm:px-8 lg:px-10">
          <p>© 2026 JustStretch, a student research project</p>
          <p>Not a medical device. Stop any stretch that causes sharp pain.</p>
        </footer>
      </div>
    </div>
  )
}
