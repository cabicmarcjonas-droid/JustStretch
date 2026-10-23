import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { btn, pageTitle } from '../lib/ui.js'

// Also rendered in place by pages whose API call returns 403.
export default function Forbidden() {
  const { user } = useAuth()

  return (
    <PublicLayout title="Not allowed">
      <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="font-mono text-[56px] font-medium leading-none text-accent">403</p>
        <p className="mt-3 text-[13px] font-medium text-muted">Not allowed</p>
        <h1 className={`mt-2 ${pageTitle}`}>You can&apos;t edit this</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          Exercises in the library can only be changed or deleted by the member who added them. You can still view it and use it for
          your own sessions.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <>
              <Link to="/exercises" className={`${btn.primary} ${btn.lg}`}>
                Back to the library
              </Link>
              <Link to="/dashboard" className={`${btn.secondary} ${btn.lg}`}>
                Dashboard
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
