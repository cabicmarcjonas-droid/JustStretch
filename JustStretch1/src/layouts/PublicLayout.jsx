import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import Navbar, { navButton } from '../components/Navbar.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../lib/hooks.js'
import { container } from '../lib/ui.js'

const LINKS = [
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#privacy', label: 'Privacy' },
  { to: '/about', label: 'About' },
  { to: '/#contact', label: 'Contact' },
]

const EMAIL = 'juststretch@gmail.com'

// Thin strip above the nav with the contact details. Only the landing page shows it.
function ContactBar() {
  return (
    <div className="bg-accent-dark text-[13px] text-white">
      <div className={`${container} flex h-9 items-center justify-between gap-4`}>
        <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:underline focus-visible:outline-2 focus-visible:outline-white">
          <Icon name="mail" className="h-4 w-4" />
          {EMAIL}
        </a>
        <span className="hidden items-center gap-2 sm:inline-flex">
          <Icon name="pin" className="h-4 w-4" />
          Mandaluyong City, Philippines
        </span>
      </div>
    </div>
  )
}

export default function PublicLayout({ title, children, contactBar = false, credits = null }) {
  const { user } = useAuth()
  usePageTitle(title)

  const actions = user ? (
    <Link to="/dashboard" className={navButton}>
      Dashboard
    </Link>
  ) : (
    <>
      <Link to="/login" className="whitespace-nowrap text-[15px] font-medium text-ink hover:text-accent">
        Log in
      </Link>
      <Link to="/register" className={navButton}>
        Create account
      </Link>
    </>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      {contactBar && <ContactBar />}
      <Navbar links={LINKS} actions={actions} />
      <main className="flex-1">{children}</main>
      <SiteFooter credits={credits} />
    </div>
  )
}
