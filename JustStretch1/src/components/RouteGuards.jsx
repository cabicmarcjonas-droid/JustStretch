import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-sm text-muted" role="status">
      Loading…
    </div>
  )
}

// Logged-in users only. Remembers where they were going so login can send them back
// (Laravel's redirect()->intended()).
export function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  return children
}

// Login and register are for guests. Signed-in users are sent to the page they were
// originally after (set by RequireAuth), or to the dashboard. Doing the redirect here
// also covers the moment right after a successful login.
export function GuestOnly({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <Loading />
  if (user) return <Navigate to={location.state?.from ?? '/dashboard'} replace />
  return children
}
