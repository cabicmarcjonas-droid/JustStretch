import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'

const primary = 'inline-flex items-center px-5 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark'
const secondary = 'inline-flex items-center px-5 py-3 rounded-full border border-line bg-white font-medium hover:border-ink'

const STEPS = [
  { n: 1, title: 'Pick what hurts', body: 'Filter the library by body area and difficulty to find a stretch that fits how you feel today.' },
  { n: 2, title: 'Stretch on camera', body: 'Turn on your webcam and follow the steps while a live skeleton highlights the joints that matter.' },
  { n: 3, title: 'Rate and track', body: 'Score your own form when you finish. Your dashboard shows minutes stretched and how your scores trend.' },
]

const FEATURES = [
  {
    title: 'A growing exercise library',
    body: 'Searchable stretches for the neck, back, hips, legs and wrists, each with clear steps, benefits and safety notes.',
  },
  {
    title: 'Live pose tracking',
    body: 'MediaPipe Pose runs inside your browser and draws your skeleton in real time, emphasising the target joints.',
  },
  {
    title: 'Community contributed',
    body: 'Any member can add a stretch they find helpful. Only the author can edit or remove it, so entries stay trustworthy.',
  },
  {
    title: 'Private by design',
    body: 'Video never leaves your device. We only save the score, duration and notes you choose to submit.',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium text-accent tracking-wide uppercase">Guided stretching &amp; gentle rehab</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold">
            Ease the everyday aches, one careful stretch at a time.
          </h1>
          <p className="mt-5 text-lg text-muted max-w-xl">
            Just Stretch pairs a library of simple, low-risk stretches with live pose tracking from your webcam, so you can see whether
            the right parts of your body are actually doing the work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link to="/dashboard" className={primary}>
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className={primary}>
                  Create a free account
                </Link>
                <Link to="/login" className={secondary}>
                  I already have one
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Illustrative pose-tracking panel (pure SVG, no photos) */}
        <div className="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" /> Tracking
            </span>
            <span>Target area: Neck</span>
          </div>
          <svg
            viewBox="0 0 200 290"
            className="mx-auto mt-4 h-72 w-auto"
            aria-label="Illustration of a tracked body skeleton with neck joints highlighted"
            role="img"
          >
            <g stroke="#c9cbc4" strokeWidth="3" strokeLinecap="round">
              <line x1="75" y1="88" x2="125" y2="88" />
              <line x1="75" y1="88" x2="58" y2="130" />
              <line x1="58" y1="130" x2="52" y2="170" />
              <line x1="125" y1="88" x2="142" y2="130" />
              <line x1="142" y1="130" x2="148" y2="170" />
              <line x1="75" y1="88" x2="85" y2="165" />
              <line x1="125" y1="88" x2="115" y2="165" />
              <line x1="85" y1="165" x2="115" y2="165" />
              <line x1="85" y1="165" x2="82" y2="220" />
              <line x1="82" y1="220" x2="80" y2="272" />
              <line x1="115" y1="165" x2="118" y2="220" />
              <line x1="118" y1="220" x2="120" y2="272" />
            </g>
            <g fill="#6b6f69">
              <circle cx="58" cy="130" r="3.5" />
              <circle cx="142" cy="130" r="3.5" />
              <circle cx="52" cy="170" r="3.5" />
              <circle cx="148" cy="170" r="3.5" />
              <circle cx="85" cy="165" r="3.5" />
              <circle cx="115" cy="165" r="3.5" />
              <circle cx="82" cy="220" r="3.5" />
              <circle cx="118" cy="220" r="3.5" />
              <circle cx="80" cy="272" r="3.5" />
              <circle cx="120" cy="272" r="3.5" />
            </g>
            <circle cx="104" cy="45" r="24" fill="none" stroke="#e4e4df" strokeWidth="2" />
            <g fill="#3f6b52">
              <circle cx="106" cy="48" r="6" />
              <circle cx="84" cy="44" r="6" />
              <circle cx="124" cy="44" r="6" />
              <circle cx="75" cy="88" r="7" />
              <circle cx="125" cy="88" r="7" />
            </g>
          </svg>
          <p className="mt-4 text-center text-sm text-muted">Highlighted joints follow the area you are stretching.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="font-display text-3xl font-semibold">How it works</h2>
          <p className="mt-3 text-muted max-w-2xl">Three short steps, no equipment, no appointment needed.</p>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-2xl border border-line bg-paper p-6">
                <span className="font-display text-3xl text-accent">{step.n}</span>
                <h3 className="mt-3 font-semibold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="font-display text-3xl font-semibold">What you get</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-ink text-white px-6 py-12 sm:px-12 text-center">
          <h2 className="font-display text-3xl font-semibold">Five minutes a day is a good start.</h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">Set up an account and try your first guided stretch in under a minute.</p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="mt-8 inline-flex items-center px-5 py-3 rounded-full bg-white text-ink font-medium hover:bg-paper"
          >
            {user ? 'Open dashboard' : 'Get started'}
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
