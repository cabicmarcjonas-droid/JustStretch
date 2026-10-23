import Team from '../components/Team.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { card, cardHead, container, displayTitle, eyebrow, h2, lede, statLabel } from '../lib/ui.js'

const FACTS = [
  ['33', 'body landmarks tracked live by MediaPipe'],
  ['6', 'stretches with 3D reference animations'],
  ['0', 'video frames uploaded, ever'],
]

const PROBLEMS = [
  'Minor chronic muscle pain is common among students and desk workers, and it often goes untreated.',
  'Professional physiotherapy costs money and travel time that many people cannot spare for a "minor" ache.',
  'Following a stretch from a static picture or video gives no feedback, so people are never sure they are doing it right.',
]

const GOALS = [
  { n: 3, title: 'Good Health & Well-being', body: 'Encourages regular, safe movement to manage everyday musculoskeletal pain.' },
  { n: 9, title: 'Industry, Innovation & Infrastructure', body: 'Browser-based pose tracking built on open web standards, so no specialist hardware is needed.' },
  { n: 10, title: 'Reduced Inequalities', body: 'Free guidance that only needs a browser and a webcam, not a clinic visit.' },
]

const STACK = [
  ['Frontend', 'React 19, React Router 7'],
  ['Backend', 'Node.js and Express 5 (REST API)'],
  ['Database', 'MongoDB with Mongoose'],
  ['Authentication', 'Server-side sessions (express-session, bcrypt)'],
  ['Styling', 'Tailwind CSS'],
  ['Pose tracking', 'MediaPipe Tasks Vision (PoseLandmarker and HandLandmarker)'],
  ['Build tool', 'Vite'],
  ['3D content', 'Blender reference animations'],
]

function Section({ label, title, children, tint = false }) {
  return (
    <section className={`border-t border-line ${tint ? 'bg-paper-2' : ''}`}>
      <div className={`${container} py-14 sm:py-20`}>
        <p className={eyebrow}>{label}</p>
        <h2 className={`mt-3 ${h2}`}>{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

export default function About() {
  return (
    <PublicLayout title="About">
      <section className={`${container} grid items-end gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_420px] lg:gap-16`}>
        <div>
          <p className={eyebrow}>About</p>
          <h1 className={`mt-3 max-w-[40rem] ${displayTitle}`}>Physio-style guidance, without the clinic visit.</h1>
          <p className={`mt-6 max-w-2xl ${lede}`}>
            Many people live with a stiff neck or a sore lower back for months because seeing a physiotherapist is expensive, far away, or
            hard to fit into a working week. JustStretch is a small step toward closing that gap.
          </p>
        </div>
        <dl className={`${card} divide-y divide-line`}>
          {FACTS.map(([n, text]) => (
            <div key={text} className="flex items-baseline gap-4 px-5 py-4">
              <dt className="w-10 shrink-0 font-mono text-[28px] font-medium leading-none text-accent">{n}</dt>
              <dd className="text-[15px] text-ink-2">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-line">
        <div className={`${container} grid gap-6 py-14 sm:py-20 lg:grid-cols-2`}>
          <div className={`${card} overflow-hidden`}>
            <h2 className={`${cardHead} ${statLabel}`}>The problem</h2>
            <ul className="divide-y divide-line">
              {PROBLEMS.map((text) => (
                <li key={text} className="flex gap-3 px-5 py-4 text-[15px] leading-relaxed text-ink-2">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-sm bg-accent" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${card} overflow-hidden`}>
            <h2 className={`${cardHead} ${statLabel}`}>Our approach</h2>
            <p className="px-5 py-4 text-[15px] leading-relaxed text-ink-2">
              A curated, community-maintained library of gentle stretches grouped by body area. When you start a session, a pose-estimation
              model analyses your webcam feed in the browser and highlights the joints that matter, giving you a live mirror of your
              posture. Afterwards you get a form score, and the app keeps a simple history so you can see your consistency improve.
            </p>
          </div>
        </div>
      </section>

      <Section label="Sustainable Development Goals" title="Why it matters" tint>
        <div className="grid gap-4 md:grid-cols-3">
          {GOALS.map((goal) => (
            <div key={goal.n} className={`${card} p-5`}>
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-accent px-2 font-mono text-[17px] font-medium text-white">
                {goal.n}
              </span>
              <h3 className="mt-4 text-[17px] font-semibold">{goal.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{goal.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Built with" title="The stack">
        <dl className={`${card} grid sm:grid-cols-2`}>
          {STACK.map(([labelText, value]) => (
            <div key={labelText} className="flex justify-between gap-4 border-b border-line px-5 py-3.5 sm:odd:border-r">
              <dt className={statLabel}>{labelText}</dt>
              <dd className="text-right text-[15px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label="Team" title="Who made it" tint>
        <Team />
        <p className="mt-10 max-w-2xl text-sm text-muted">
          JustStretch is a student project and is not a medical device. If a stretch causes sharp or worsening pain, stop and seek
          professional advice.
        </p>
      </Section>
    </PublicLayout>
  )
}
