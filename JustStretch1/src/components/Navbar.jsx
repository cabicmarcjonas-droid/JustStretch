import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { btn, container } from '../lib/ui.js'
import Icon from './Icon.jsx'
import { Wordmark } from './Mark.jsx'

const linkClass = ({ isActive }) =>
  `text-[15px] transition-colors ${isActive ? 'font-semibold text-accent underline underline-offset-4' : 'font-medium text-ink-2 hover:text-ink'}`

const mobileLinkClass = 'block rounded-md px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink'

export const navButton = `${btn.primary} ${btn.md}`

// Public top bar (N1b): wordmark left, links centred, actions right. `links` are
// { to, label, end? }; `actions` render on the right (desktop) and under the links on phones.
// Hash links ("/#privacy") are plain links, so the browser scrolls to the section.
export default function Navbar({ home = '/', links, actions }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className={`${container} flex h-16 items-center justify-between gap-6`}>
        <Link to={home} className="shrink-0 lg:w-64">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) =>
            typeof link.to === 'string' && link.to.includes('#') ? (
              <a key={link.label} href={link.to} className={linkClass({ isActive: false })}>
                {link.label}
              </a>
            ) : (
              <NavLink key={link.label} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ),
          )}
        </div>

        <div className="hidden items-center justify-end gap-5 md:flex lg:w-64">{actions}</div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-me-2 rounded-md p-2 text-ink-2 hover:bg-paper-2 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? 'x' : 'menu'} className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-line px-4 py-3 md:hidden">
          {links.map((link) =>
            typeof link.to === 'string' && link.to.includes('#') ? (
              <a key={link.label} href={link.to} className={mobileLinkClass} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to} className={mobileLinkClass} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ),
          )}
          <div className="flex items-center gap-4 border-t border-line px-3 pt-3">{actions}</div>
        </div>
      )}
    </nav>
  )
}
