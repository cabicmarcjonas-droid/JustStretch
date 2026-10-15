import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Flash from '../components/Flash.jsx'
import Navbar from '../components/Navbar.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../lib/hooks.js'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/exercises', label: 'Exercises' },
  { to: '/sessions', label: 'My Sessions' },
]

const menuItem =
  'block w-full px-4 py-2.5 text-start text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:bg-emerald-50'

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
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-600 focus:outline-none"
      >
        {user.name}
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl" role="menu" onClick={() => setOpen(false)}>
          <Link to="/profile" className={menuItem} role="menuitem">
            Profile
          </Link>
          <button type="button" onClick={onLogout} className={menuItem} role="menuitem">
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppLayout({ title, header, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  usePageTitle(title)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const mobileAccount = (
    <div className="mt-2 border-t border-slate-200 pt-3">
      <div className="px-3">
        <div className="text-sm font-black text-slate-900">{user.name}</div>
        <div className="text-xs font-medium text-slate-500">{user.email}</div>
      </div>
      <div className="mt-2 space-y-1">
        <Link to="/profile" className="block rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-600">
          Profile
        </Link>
        <button type="button" onClick={handleLogout} className="block w-full rounded-lg px-3 py-2.5 text-start text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-600">
          Log Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar home="/dashboard" links={LINKS} actions={<UserMenu user={user} onLogout={handleLogout} />} mobileActions={mobileAccount} />

      {header && (
        <header className="border-b border-slate-200 bg-white/70">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{header}</div>
        </header>
      )}

      <Flash />

      <main className="flex-1">{children}</main>

      <SiteFooter>Just Stretch is a guide, not a diagnosis. Stop any stretch that causes sharp pain and consult a professional.</SiteFooter>
    </div>
  )
}
