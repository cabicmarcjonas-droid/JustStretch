import { Link } from 'react-router-dom'
import Navbar, { navButton } from '../components/Navbar.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../lib/hooks.js'

const LINKS = [
  { to: '/about', label: 'About' },
  { to: { pathname: '/', hash: '#contact' }, label: 'Contact' },
]

export default function PublicLayout({ title, children }) {
  const { user } = useAuth()
  usePageTitle(title)

  const action = user ? (
    <Link to="/dashboard" className={navButton}>
      Dashboard
    </Link>
  ) : (
    <Link to="/login" className={navButton}>
      Log in
    </Link>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar links={LINKS} actions={action} mobileActions={<div className="pt-2">{action}</div>} />
      <main className="flex-1">{children}</main>
      <SiteFooter>Not a substitute for medical advice.</SiteFooter>
    </div>
  )
}
