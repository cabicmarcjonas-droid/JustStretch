import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { usePageTitle } from '../lib/hooks.js'

export default function GuestLayout({ children }) {
  usePageTitle()

  return (
    <div className="min-h-screen flex flex-col sm:justify-center items-center px-4 py-10">
      <Link to="/" className="flex items-center gap-3 text-ink">
        <Logo className="w-11 h-11 text-accent" />
        <span className="font-display text-2xl font-semibold">Just Stretch</span>
      </Link>

      <div className="w-full sm:max-w-md mt-8 px-6 py-8 bg-white border border-line rounded-2xl">{children}</div>

      <Link to="/" className="mt-6 text-sm text-muted hover:text-ink">
        &larr; Back to home
      </Link>
    </div>
  )
}
