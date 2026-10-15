import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Contact from '../components/Contact.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import '../css/LandingPage.css'

const STEPS = [
  { n: 1, title: 'Pick what hurts', body: 'Filter the library by body area and difficulty to find a stretch that fits how you feel today.' },
  { n: 2, title: 'Stretch on camera', body: 'Turn on your webcam and follow the steps while a live skeleton highlights the joints that matter.' },
  { n: 3, title: 'Rate and track', body: 'Your camera scores your form against a reference pose. Your dashboard shows minutes stretched and how your scores trend.' },
]

const FEATURES = [
  { title: 'A growing exercise library', body: 'Searchable stretches for the neck, back, hips, legs and wrists, each with clear steps, benefits and safety notes.' },
  { title: 'Live pose tracking', body: 'MediaPipe Pose and Hand Landmarker run inside your browser and draw your skeleton in real time, emphasising the target joints.' },
  { title: 'Community contributed', body: 'Any member can add a stretch they find helpful. Only the author can edit or remove it, so entries stay trustworthy.' },
  { title: 'Private by design', body: 'Video never leaves your device. We only save the score, duration and notes you choose to submit.' },
]

const card = 'rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200/40'

export default function LandingPage() {
  const { user } = useAuth()
  const { hash } = useLocation()

  // Links like /#contact from other pages scroll to the section once the page is rendered.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <PublicLayout>
      <section id="hero" className="hero-section">
        <h1>Welcome to JustStretch</h1>
        <p>Stretch better. Move better. Feel better.</p>
        <Link to={user ? '/dashboard' : '/register'} className="hero-cta">
          {user ? 'Go to your dashboard' : 'Get Started'} &rarr;
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-black italic tracking-tighter">How it works</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Three short steps, no equipment, no appointment needed.</p>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className={card}>
              <span className="text-4xl font-black italic tracking-tighter text-emerald-600">{step.n}</span>
              <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-black italic tracking-tighter">What you get</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className={card}>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Contact />
    </PublicLayout>
  )
}
