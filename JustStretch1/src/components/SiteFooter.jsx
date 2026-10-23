import { container } from '../lib/ui.js'

export default function SiteFooter({ children }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className={`${container} flex flex-col gap-2 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left`}>
        <p className="text-sm font-medium text-slate-500">
          <span className="me-2 font-black italic tracking-tighter text-ink">JustStretch</span>© 2026 · Just a team with a big dream.
        </p>
        {children && <p className="text-sm font-medium text-slate-500 sm:text-right">{children}</p>}
      </div>
    </footer>
  )
}
