import { Link } from 'react-router-dom'
import { btn } from '../lib/ui.js'

const square = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium'

function PageLink({ to, page, children, label }) {
  if (page === null) {
    return (
      <span aria-disabled="true" className={`${btn.secondary} h-9 px-3 text-sm cursor-default text-muted opacity-60`}>
        {children}
      </span>
    )
  }
  return (
    <Link to={to(page)} aria-label={label} className={`${btn.secondary} h-9 px-3 text-sm`}>
      {children}
    </Link>
  )
}

// `to(page)` returns the URL for a page, so filters in the query string are kept.
// `noun` names what is being paged ("exercises", "sessions").
export default function Pagination({ meta, perPage, to, noun = 'results' }) {
  const { page, lastPage, total } = meta
  if (lastPage <= 1) return null

  const from = (page - 1) * perPage + 1
  const upTo = Math.min(page * perPage, total)
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)

  return (
    <nav role="navigation" aria-label="Pagination Navigation" className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted">
        Showing{' '}
        <span className="font-medium text-ink">
          {from}–{upTo}
        </span>{' '}
        of <span className="font-medium text-ink">{total}</span> {noun}
      </p>

      <div className="flex items-center gap-2">
        <PageLink to={to} page={page > 1 ? page - 1 : null} label="Previous page">
          Previous
        </PageLink>
        <span className="hidden items-center gap-2 sm:inline-flex">
          {pages.map((number) =>
            number === page ? (
              <span key={number} aria-current="page" className={`${square} bg-accent text-white`}>
                {number}
              </span>
            ) : (
              <Link
                key={number}
                to={to(number)}
                aria-label={`Go to page ${number}`}
                className={`${square} border border-line-strong bg-surface text-ink hover:bg-paper-2`}
              >
                {number}
              </Link>
            ),
          )}
        </span>
        <PageLink to={to} page={page < lastPage ? page + 1 : null} label="Next page">
          Next
        </PageLink>
      </div>
    </nav>
  )
}
