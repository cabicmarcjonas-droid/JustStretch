import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'

// errors/403.blade.php. Also rendered in place by pages whose API call returns 403.
export default function Forbidden() {
  const { user } = useAuth()

  return (
    <PublicLayout title="Not allowed">
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <p className="mt-6 text-sm font-medium text-muted">Error 403</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black italic tracking-tighter">You can&apos;t edit this</h1>
        <p className="mt-4 text-muted">
          Exercises in the library can only be changed or deleted by the member who added them. You can still view it and use it for
          your own sessions.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <>
              <Link
                to="/exercises"
                className="inline-flex items-center px-5 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark"
              >
                Back to the library
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-5 py-3 rounded-xl border border-line bg-white font-bold hover:border-ink"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link to="/" className="inline-flex items-center px-5 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark">
              Go home
            </Link>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
