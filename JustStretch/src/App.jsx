import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Session from './pages/session.jsx'
import { Login } from './components/Login.jsx'

// A reusable "frame" that puts Navbar + Footer around any page
function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

// The "bouncer" — checks login status before showing a page
function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    // Not logged in? Send them back to Login.
    return <Navigate to="/" replace />
  }
  // Logged in? Show the page inside the normal site layout.
  return <SiteLayout>{children}</SiteLayout>
}

export default function App() {
  // isLoggedIn = the switch. Starts OFF (false).
  // setIsLoggedIn = the only way to turn it ON.
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <Routes>
      {/* Login page. When login succeeds, flip the switch ON. */}
      <Route
        path="/"
        element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />}
      />

      {/* Every page below is behind the bouncer */}
      <Route
        path="/home"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <About />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contact"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Contact />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Session />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}