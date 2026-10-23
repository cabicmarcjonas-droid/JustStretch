import { Link } from 'react-router-dom'
import { btn } from '../lib/ui.js'

const square = 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold'

function PageLink({ to, page, children, label }) {
  if (page === null) {
    return (
      <span aria-disabled="true" className={`${btn.secondary} ${btn.md} opacity-50 cursor-default`}>
        {children}
      </span>
    )
  }
  return (
    <Link to={to(page)} aria-label={label} className={`${btn.secondary} ${btn.md}`}>
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
        <span className="font-semibold text-ink">
          {from}–{upTo}
        </span>{' '}
        of <span className="font-semibold text-ink">{total}</span> {noun}
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
                className={`${square} border border-slate-300 bg-white text-ink hover:bg-slate-50`}
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
