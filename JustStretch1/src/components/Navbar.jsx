import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  `text-sm font-bold transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`

const mobileLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
  }`

export const navButton =
  'inline-flex items-center bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95'

// Solid white bar with the italic wordmark, shared by the public and signed-in layouts.
// `links` are { to, label, end? }; `actions` render on the right (desktop); `mobileActions` sit
// under the links in the hamburger menu.
export default function Navbar({ home = '/', links, actions, mobileActions }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to={home} className="text-2xl font-black italic tracking-tighter text-slate-900">
          JustStretch
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          {links.map((link) => (
            <NavLink key={link.label} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {actions}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-me-2 rounded-lg p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 sm:hidden"
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
        <div className="space-y-1 border-t border-slate-200 px-4 py-3 sm:hidden">
          {links.map((link) => (
            <NavLink key={link.label} to={link.to} end={link.end} className={mobileLinkClass} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          {mobileActions}
        </div>
      )}
    </nav>
  )
}
