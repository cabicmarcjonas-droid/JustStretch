import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireAuth } from './components/RouteGuards.jsx'
import About from './pages/About.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ExerciseCreate from './pages/ExerciseCreate.jsx'
import ExerciseEdit from './pages/ExerciseEdit.jsx'
import ExerciseShow from './pages/ExerciseShow.jsx'
import ExercisesIndex from './pages/ExercisesIndex.jsx'
import Forbidden from './pages/Forbidden.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'
import SessionsIndex from './pages/SessionsIndex.jsx'

// The session page pulls in MediaPipe (~0.5 MB), so it loads only when someone starts a session.
const SessionCreate = lazy(() => import('./pages/SessionCreate.jsx'))

const guarded = (page) => <RequireAuth>{page}</RequireAuth>

const sessionPage = (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center text-sm text-muted" role="status">
        Loading…
      </div>
    }
  >
    <SessionCreate />
  </Suspense>
)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/403" element={<Forbidden />} />

      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route path="/dashboard" element={guarded(<Dashboard />)} />
      <Route path="/exercises" element={guarded(<ExercisesIndex />)} />
      <Route path="/exercises/new" element={guarded(<ExerciseCreate />)} />
      <Route path="/exercises/:id" element={guarded(<ExerciseShow />)} />
      <Route path="/exercises/:id/edit" element={guarded(<ExerciseEdit />)} />
      <Route path="/exercises/:id/session" element={guarded(sessionPage)} />
      <Route path="/sessions" element={guarded(<SessionsIndex />)} />
      <Route path="/profile" element={guarded(<Profile />)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
