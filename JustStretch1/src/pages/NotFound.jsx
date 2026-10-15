import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout.jsx'

export default function NotFound() {
  return (
    <PublicLayout title="Page not found">
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <p className="text-sm font-medium text-muted">Error 404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black italic tracking-tighter">We can&apos;t find that page</h1>
        <p className="mt-4 text-muted">The link may be old, or the exercise may have been removed from the library.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center px-5 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark">
            Go home
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
