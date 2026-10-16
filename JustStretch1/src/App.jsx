import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { GuestOnly, RequireAuth } from './components/RouteGuards.jsx'
import About from './pages/About.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ExerciseCreate from './pages/ExerciseCreate.jsx'
import ExerciseEdit from './pages/ExerciseEdit.jsx'
import ExerciseShow from './pages/ExerciseShow.jsx'
import ExercisesIndex from './pages/ExercisesIndex.jsx'
import Forbidden from './pages/Forbidden.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'
import SessionsIndex from './pages/SessionsIndex.jsx'

// The session page pulls in MediaPipe (~0.5 MB), so it loads only when someone starts a session.
const SessionCreate = lazy(() => import('./pages/SessionCreate.jsx'))

const guarded = (page) => <RequireAuth>{page}</RequireAuth>
const guestOnly = (page) => <GuestOnly>{page}</GuestOnly>

const sessionPage = (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500" role="status">
        Loading…
      </div>
    }
  >
    <SessionCreate />
  </Suspense>
)

// Old JustStretch1 address /exercise/:id now lives at /exercises/:id.
function LegacyExerciseRedirect() {
  const { id } = useParams()
  return <Navigate to={`/exercises/${id}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/403" element={<Forbidden />} />

      <Route path="/login" element={guestOnly(<LoginPage />)} />
      <Route path="/register" element={guestOnly(<LoginPage initialView="register" />)} />

      <Route path="/dashboard" element={guarded(<Dashboard />)} />
      <Route path="/exercises" element={guarded(<ExercisesIndex />)} />
      <Route path="/exercises/new" element={guarded(<ExerciseCreate />)} />
      <Route path="/exercises/:id" element={guarded(<ExerciseShow />)} />
      <Route path="/exercises/:id/edit" element={guarded(<ExerciseEdit />)} />
      <Route path="/exercises/:id/session" element={guarded(sessionPage)} />
      <Route path="/sessions" element={guarded(<SessionsIndex />)} />
      <Route path="/profile" element={guarded(<Profile />)} />

      {/* Redirects for the old JustStretch1 paths */}
      <Route path="/main" element={<Navigate to="/dashboard" replace />} />
      <Route path="/exercise/:id" element={<LegacyExerciseRedirect />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
