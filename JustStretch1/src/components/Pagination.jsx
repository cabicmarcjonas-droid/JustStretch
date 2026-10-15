import { Link } from 'react-router-dom'

const base = 'inline-flex items-center px-3.5 py-2 text-sm font-medium border border-line bg-white'
const active = 'text-ink hover:border-ink'
const disabled = 'text-muted/60 cursor-default'

function PageLink({ to, page, current, children, className = '', label }) {
  if (page === null) {
    return (
      <span aria-disabled="true" className={`${base} ${disabled} ${className}`}>
        {children}
      </span>
    )
  }
  return (
    <Link
      to={to(page)}
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      className={`${base} ${current ? 'bg-accent-soft text-accent-dark border-accent/30 cursor-default' : active} ${className}`}
    >
      {children}
    </Link>
  )
}

// `to(page)` returns the URL for a page, so filters in the query string are kept.
export default function Pagination({ meta, perPage, to }) {
  const { page, lastPage, total } = meta
  if (lastPage <= 1) return null

  const from = (page - 1) * perPage + 1
  const upTo = Math.min(page * perPage, total)
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)

  return (
    <nav role="navigation" aria-label="Pagination Navigation" className="flex items-center justify-between gap-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <PageLink to={to} page={page > 1 ? page - 1 : null} className="rounded-xl">
          Previous
        </PageLink>
        <PageLink to={to} page={page < lastPage ? page + 1 : null} className="rounded-xl">
          Next
        </PageLink>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Showing <span className="font-medium text-ink">{from}</span> to <span className="font-medium text-ink">{upTo}</span> of{' '}
          <span className="font-medium text-ink">{total}</span> results
        </p>

        <span className="inline-flex rounded-xl shadow-sm">
          <PageLink to={to} page={page > 1 ? page - 1 : null} label="Previous" className="rounded-s-xl">
            &lsaquo;
          </PageLink>
          {pages.map((number) => (
            <PageLink key={number} to={to} page={number} current={number === page} label={`Go to page ${number}`} className="-ms-px">
              {number}
            </PageLink>
          ))}
          <PageLink to={to} page={page < lastPage ? page + 1 : null} label="Next" className="-ms-px rounded-e-xl">
            &rsaquo;
          </PageLink>
        </span>
      </div>
    </nav>
  )
}
