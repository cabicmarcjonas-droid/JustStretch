import { Link } from 'react-router-dom'
import { btn } from '../lib/ui.js'

const DefaultIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function EmptyState({ message, hint, actionTo, actionLabel, icon, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paper-2 text-muted">{icon ?? DefaultIcon}</div>
      <p className="mt-3 font-semibold text-ink">{message}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {actionTo && actionLabel && (
        <Link to={actionTo} className={`mt-5 ${btn.primary} ${btn.md}`}>
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
