import { Link } from 'react-router-dom'
import Navbar, { navButton } from '../components/Navbar.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../lib/hooks.js'

const LINKS = [
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#privacy', label: 'Privacy' },
  { to: '/about', label: 'About' },
  { to: '/#contact', label: 'Contact' },
]

export default function PublicLayout({ title, children }) {
  const { user } = useAuth()
  usePageTitle(title)

  const actions = user ? (
    <Link to="/dashboard" className={navButton}>
      Dashboard
    </Link>
  ) : (
    <>
      <Link to="/login" className="text-[15px] font-medium text-ink hover:text-accent">
        Log in
      </Link>
      <Link to="/register" className={navButton}>
        Create account
      </Link>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar links={LINKS} actions={actions} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
