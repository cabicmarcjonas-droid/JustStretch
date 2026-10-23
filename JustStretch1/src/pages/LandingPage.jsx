import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Contact from '../components/Contact.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { btn, card, container, displayTitle, eyebrow, h2, lede, link, statLabel } from '../lib/ui.js'

// Example values for the hero readout. They show what a session looks like, not anyone's data.
const READOUT = [
  { joint: 'Neck tilt', measured: 31, target: 35 },
  { joint: 'Left shoulder', measured: 8, target: 6 },
  { joint: 'Right shoulder', measured: 14, target: 4 },
]
const TOLERANCE = 10

// One deviation bar: the shaded band is the tolerance, the tick is the target, the dot is you.
function DeviationBar({ deviation }) {
  const off = Math.abs(deviation) >= TOLERANCE
  const x = 60 + Math.max(-56, Math.min(56, deviation * 4))
  return (
    <svg viewBox="0 0 120 18" className="h-[18px] w-[120px] shrink-0" aria-hidden="true">
      <rect x="4" y="8" width="112" height="2" rx="1" className="fill-line" />
      <rect x="20" y="5" width="80" height="8" rx="2" className="fill-accent-soft" />
      <rect x="59" y="3" width="2" height="12" className="fill-ink-2" />
      <circle cx={x} cy="9" r="5" className={off ? 'fill-caution' : 'fill-accent'} stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

function Readout() {
  return (
    <figure className={`${card} overflow-hidden`} aria-label="Example of the live readout during a session">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="flex items-baseline gap-2.5">
          <span className="text-[15px] font-semibold">Neck Side Tilt</span>
          <span className={statLabel}>Step 2 of 4</span>
        </p>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-accent">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Live · 01:24
        </span>
      </div>
      <div className="flex gap-4 p-4">
        <img src="/thumbs/neck_side_tilt.jpg" alt="" className="hidden h-[200px] w-[160px] shrink-0 rounded-md object-cover sm:block" />
        <div className="min-w-0 flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className={`${statLabel} pb-2 font-medium`}>Joint</th>
                <th className={`${statLabel} pb-2 text-right font-medium`}>Meas.</th>
                <th className={`${statLabel} pb-2 text-right font-medium`}>Target</th>
                <th className={`${statLabel} hidden pb-2 pl-3 font-medium sm:table-cell`}>Deviation · ±{TOLERANCE}°</th>
              </tr>
            </thead>
            <tbody>
              {READOUT.map((row) => (
                <tr key={row.joint} className="border-b border-line">
                  <td className="py-2.5 font-medium">{row.joint}</td>
                  <td className="py-2.5 text-right font-mono">{row.measured}°</td>
                  <td className="py-2.5 text-right font-mono text-muted">{row.target}°</td>
                  <td className="hidden py-2.5 pl-3 sm:table-cell">
                    <DeviationBar deviation={row.measured - row.target} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 flex items-center gap-2 rounded-md bg-caution-soft px-3 py-2 text-[13px] font-medium text-caution">
            <Icon name="warn" className="h-4 w-4 shrink-0" />
            Right shoulder is 10° above target. Lower it.
          </p>
        </div>
      </div>
      <figcaption className="flex items-center justify-between border-t border-line bg-paper-2 px-4 py-2.5">
        <span className={statLabel}>Form score</span>
        <span className="font-mono text-[15px] font-medium">86 / 100</span>
      </figcaption>
    </figure>
  )
}

// Measured vs target angle at the neck, with the tolerance noted underneath.
function AngleDiagram() {
  return (
    <svg
      viewBox="0 0 560 300"
      className="h-auto w-full"
      role="img"
      aria-label="Diagram: measured neck tilt of 31 degrees against a 35 degree target, within a 10 degree tolerance"
    >
      <path d="M80 250H480" className="stroke-line" />
      <path d="M150 200L280 196L410 200" className="stroke-ink-2" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M280 196L280 70" className="stroke-line-strong" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M280 196L338 88" className="stroke-ink-2" strokeWidth="2" strokeDasharray="3 5" />
      <path d="M280 196L322 80" className="stroke-accent" strokeWidth="4" strokeLinecap="round" />
      <circle cx="330" cy="56" r="26" className="stroke-ink-2" strokeWidth="3" fill="none" />
      <path d="M280 136A60 60 0 0 1 300.5 139.6" className="stroke-accent" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="280" cy="196" r="7" className="fill-accent" stroke="#fff" strokeWidth="2" />
      <circle cx="150" cy="200" r="5" className="fill-ink-2" />
      <circle cx="410" cy="200" r="5" className="fill-ink-2" />
      <text x="96" y="104" className="fill-accent font-mono text-[13px]">
        MEASURED 31°
      </text>
      <text x="352" y="128" className="fill-ink-2 font-mono text-[13px]">
        TARGET 35°
      </text>
      <text x="80" y="282" className="fill-muted font-mono text-[12px]">
        NECK TILT · TOLERANCE ±10° · IN RANGE
      </text>
    </svg>
  )
}

function FlowBox({ title, items, highlight = false }) {
  return (
    <div className={`min-w-0 flex-1 rounded-md border p-4 ${highlight ? 'border-accent-mid bg-accent-soft' : 'border-line bg-paper'}`}>
      <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.04em] ${highlight ? 'text-accent-dark' : 'text-muted'}`}>{title}</p>
      <ul className="mt-2 space-y-1 text-sm font-medium">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function DataFlow() {
  const arrow = <Icon name="arrowRight" className="h-5 w-5 shrink-0 rotate-90 self-center text-ink-2 sm:rotate-0" />
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <FlowBox title="Your camera" items={['Video frames']} />
        {arrow}
        <FlowBox title="This browser tab" items={['Pose landmarks', 'Joint angles', 'Live score']} highlight />
        {arrow}
        <FlowBox title="JustStretch server" items={['Score', 'Duration', 'Your notes']} />
      </div>
      <p className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-4 py-3 text-sm font-medium text-danger">
        <Icon name="ban" className="h-4 w-4 shrink-0" />
        Never sent to the server: video frames, images, body landmarks.
      </p>
    </div>
  )
}

const STOP = ['Sharp or worsening pain', 'Numbness or tingling spreading into an arm or leg', 'Dizziness', 'Pain from a recent injury or surgery']

const FAQ = [
  ['Do I need any equipment?', 'A laptop or phone with a webcam, and enough space to be seen from head to hips. Nothing else.'],
  [
    'Which body areas are covered?',
    'Neck, shoulders, chest, back, hips, legs and wrists. Stretches with a 3D reference video get a live score from the camera; the rest use a score you rate yourself.',
  ],
  ['Is it free?', 'Yes. You need an account to save sessions and see your history.'],
  ['Who made this?', 'Four IT students at José Rizal University in Mandaluyong City, as a research project on browser-based pose tracking.'],
]

function Split({ id, label, title, children, proof, flip = false, tint = false }) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-line ${tint ? 'bg-paper-2' : ''}`}>
      <div className={`${container} grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16`}>
        <div className={flip ? 'lg:order-2' : ''}>
          <p className={eyebrow}>{label}</p>
          <h2 className={`mt-3 ${h2}`}>{title}</h2>
          <div className={`mt-5 max-w-[34rem] space-y-4 ${lede}`}>{children}</div>
        </div>
        <div className={`min-w-0 ${flip ? 'lg:order-1' : ''}`}>{proof}</div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const { hash } = useLocation()

  // Links like /#contact from other pages scroll to the section once the page is rendered.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <PublicLayout>
      <section id="hero" className={`${container} grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_600px] lg:gap-16`}>
        <div>
          <h1 className={`max-w-[36rem] ${displayTitle}`}>Stretch at home, with measured feedback.</h1>
          <p className={`mt-6 max-w-[34rem] ${lede} sm:text-[18px]`}>
            JustStretch compares your joint angles with a 3D reference while you hold each stretch, then tells you which joint is off and
            by how much. It is built for mild, everyday muscle stiffness.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'} className={`${btn.primary} ${btn.lg}`}>
              {user ? 'Go to your dashboard' : 'Create a free account'}
            </Link>
            <a href="#how-it-works" className={`${btn.secondary} ${btn.lg}`}>
              How it works
            </a>
          </div>
          <dl className="mt-10 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-line pt-5">
            {[
              ['Runs in', 'your browser'],
              ['Video uploaded', 'none'],
              ['Diagnosis', 'not provided'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className={statLabel}>{k}</dt>
                <dd className="mt-1 text-[15px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Readout />
      </section>

      <Split
        id="how-it-works"
        label="What it measures"
        title="Angles, not a guess."
        proof={
          <div className={`${card} p-6`}>
            <AngleDiagram />
          </div>
        }
      >
        <p>
          MediaPipe finds 33 points on your body in each camera frame. JustStretch turns those into joint angles and compares them with the
          same angles in a Blender reference animation, frame by frame.
        </p>
        <p>A joint counts as in range when it is within the tolerance set for that stretch.</p>
        <p>
          <Link to={user ? '/exercises' : '/register'} className={link}>
            See the exercise library
          </Link>
        </p>
      </Split>

      <Split
        id="privacy"
        label="Privacy"
        title="Your video stays on your device."
        flip
        tint
        proof={
          <div className={`${card} p-6`}>
            <DataFlow />
          </div>
        }
      >
        <p>Pose tracking runs entirely in the browser tab you have open. Camera frames are processed and discarded on your device.</p>
        <p>When you save a session, only the score, how long it took and any notes you typed are stored with your account.</p>
      </Split>

      <Split
        id="limits"
        label="Limits"
        title="A guide, not a diagnosis."
        proof={
          <div className={`${card} p-6`}>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-caution">Stop the stretch and seek care if you feel</p>
            <ul className="mt-3">
              {STOP.map((item) => (
                <li key={item} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                  <span className="h-2 w-2 shrink-0 rounded-sm bg-caution" aria-hidden="true" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <p>
          JustStretch is for mild, everyday stiffness: a sore neck after a long day at a desk, tight hamstrings from sitting. It does not
          assess injuries or replace a physical therapist.
        </p>
        <p>
          If your scores for an area stay low, or you rate yourself very tired, session after session, the app suggests seeing a physical
          therapist and shows their contact details.
        </p>
      </Split>

      <section className="border-t border-line bg-surface">
        <div className={`${container} py-16 sm:py-24`}>
          <h2 className={h2}>Common questions</h2>
          <dl className="mt-8 grid gap-x-16 md:grid-cols-2">
            {FAQ.map(([q, a]) => (
              <div key={q} className="border-t border-line pb-6 pt-5">
                <dt className="text-[19px] font-semibold tracking-[-0.01em]">{q}</dt>
                <dd className="mt-2 max-w-[36rem] text-base leading-relaxed text-ink-2">{a}</dd>
              </div>
            ))}
          </dl>
          {!user && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to="/register" className={`${btn.primary} ${btn.lg}`}>
                Create a free account
              </Link>
              <span className="text-[15px] text-muted">Takes under a minute.</span>
            </div>
          )}
          <p className="mt-10 text-sm text-muted">The readout and diagram above are examples of what a session shows.</p>
        </div>
      </section>

      <Contact />
    </PublicLayout>
  )
}
