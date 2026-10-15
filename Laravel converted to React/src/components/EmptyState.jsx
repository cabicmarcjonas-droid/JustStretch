import { Link } from 'react-router-dom'

const DefaultIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function EmptyState({ message, hint, actionTo, actionLabel, icon, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon ?? DefaultIcon}
      </div>

      <p className="mt-4 font-medium text-ink">{message}</p>

      {hint && <p className="mt-1 text-sm text-muted max-w-sm">{hint}</p>}

      {actionTo && actionLabel && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
