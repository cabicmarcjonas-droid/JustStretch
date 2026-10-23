import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { btn, pageTitle } from '../lib/ui.js'

export default function NotFound() {
  const { user } = useAuth()

  return (
    <PublicLayout title="Page not found">
      <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="font-mono text-[56px] font-medium leading-none text-accent">404</p>
        <p className="mt-3 text-[13px] font-medium text-muted">Page not found</p>
        <h1 className={`mt-4 ${pageTitle}`}>We can&apos;t find that page</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">The link may be old, or the exercise may have been removed from the library.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className={`${btn.primary} ${btn.lg}`}>
                Go to dashboard
              </Link>
              <Link to="/exercises" className={`${btn.secondary} ${btn.lg}`}>
                <Icon name="search" className="h-4 w-4" />
                Browse exercises
              </Link>
            </>
          ) : (
            <Link to="/" className={`${btn.primary} ${btn.lg}`}>
              Go home
            </Link>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
