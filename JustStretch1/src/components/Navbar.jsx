import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { btn, container } from '../lib/ui.js'

// Active links get the accent colour and a short underline, like the Figma navbar.
const linkClass = ({ isActive }) =>
  `relative py-1 text-sm font-bold transition-colors after:absolute after:inset-x-1/2 after:-bottom-1.5 after:h-[3px] after:w-5 after:-translate-x-1/2 after:rounded-full ${
    isActive ? 'text-accent after:bg-accent' : 'text-slate-600 hover:text-accent after:bg-transparent'
  }`

const mobileLinkClass = ({ isActive }) =>
  `block rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
    isActive ? 'bg-accent-soft text-accent' : 'text-slate-600 hover:bg-slate-50 hover:text-accent'
  }`

export const navButton = `${btn.primary} ${btn.md}`

// Solid white bar with the italic wordmark, shared by the public and signed-in layouts.
// `links` are { to, label, end? }; `actions` render on the right (desktop); `mobileActions` sit
// under the links in the hamburger menu.
export default function Navbar({ home = '/', links, actions, mobileActions }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className={`${container} flex h-16 items-center justify-between`}>
        <Link to={home} className="text-[22px] font-black italic tracking-tighter text-ink">
          JustStretch
        </Link>

        <div className="hidden items-center gap-7 sm:flex">
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
          className="-me-2 rounded-lg p-2 text-slate-600 hover:bg-slate-50 hover:text-accent sm:hidden"
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
