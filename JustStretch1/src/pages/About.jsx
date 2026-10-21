import { PrivacyBand } from '../components/Icon.jsx'
import Team from '../components/Team.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { card, container, eyebrow, sectionTitle } from '../lib/ui.js'

const FACTS = [
  ['33', 'body landmarks tracked live by MediaPipe'],
  ['4', 'stretches with 3D reference animations'],
  ['0', 'video frames uploaded, ever'],
]

const PROBLEMS = [
  'Minor chronic muscle pain is common among students and desk workers, and it often goes untreated.',
  'Professional physiotherapy costs money and travel time that many people cannot spare for a "minor" ache.',
  'Following a stretch from a static picture or video gives no feedback, so people are never sure they are doing it right.',
]

const GOALS = [
  { n: 3, title: 'Good Health & Well-being', body: 'Encourages regular, safe movement to manage everyday musculoskeletal pain.' },
  { n: 10, title: 'Reduced Inequalities', body: 'Free guidance that only needs a browser and a webcam, not a clinic visit.' },
  { n: 17, title: 'Partnerships for the Goals', body: 'Members contribute exercises to a shared, open library that anyone can learn from.' },
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

function SectionHeading({ kicker, title }) {
  return (
    <div>
      <p className={eyebrow}>{kicker}</p>
      <h2 className={`mt-2 ${sectionTitle} sm:text-3xl`}>{title}</h2>
    </div>
  )
}

export default function About() {
  return (
    <PublicLayout title="About">
      <section className={`${container} grid items-center gap-10 pb-12 pt-14 sm:pt-20 lg:grid-cols-[1fr_420px] lg:gap-16`}>
        <div>
          <p className={eyebrow}>About</p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Physio-style guidance, without the clinic visit.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Many people live with a stiff neck or a sore lower back for months because seeing a physiotherapist is expensive, far away, or
            hard to fit into a working week. JustStretch is a small step toward closing that gap.
          </p>
        </div>
        <ul className="space-y-3">
          {FACTS.map(([n, text]) => (
            <li key={text} className={`${card} flex items-center gap-4 px-5 py-4`}>
              <span className="w-12 text-4xl font-black italic tracking-tighter text-accent">{n}</span>
              <span className="text-[15px] font-medium text-slate-700">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${container} grid gap-6 py-6 lg:grid-cols-2`}>
        <div className={`${card} p-6 sm:p-7`}>
          <h2 className={sectionTitle}>The problem</h2>
          <ul className="mt-4 space-y-3">
            {PROBLEMS.map((text) => (
              <li key={text} className="flex gap-3 text-[15px] leading-relaxed text-slate-600">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${card} p-6 sm:p-7`}>
          <h2 className={sectionTitle}>Our approach</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
            A curated, community-maintained library of gentle stretches grouped by body area. When you start a session, a
            pose-estimation model analyses your webcam feed in the browser and highlights the joints that matter, giving you a live
            mirror of your posture. Afterwards you get a form score, and the app keeps a simple history so you can see your consistency
            improve.
          </p>
        </div>
      </section>

      <section className={`${container} py-12`}>
        <SectionHeading kicker="Sustainable Development Goals" title="Why it matters" />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {GOALS.map((goal) => (
            <div key={goal.n} className={`${card} p-6`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl font-black italic text-white">
                {goal.n}
              </span>
              <h3 className="mt-4 text-lg font-bold">{goal.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{goal.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${container} py-6`}>
        <SectionHeading kicker="Built with" title="The stack" />
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STACK.map(([labelText, value]) => (
            <div key={labelText} className={`${card} px-5 py-4`}>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{labelText}</dt>
              <dd className="mt-1 text-[15px] font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${container} py-12`}>
        <PrivacyBand />
      </section>

      <section className={`${container} pb-10`}>
        <SectionHeading kicker="Team" title="Meet the team" />
        <div className="mt-6">
          <Team />
        </div>
      </section>

      <p className={`${container} pb-16 text-sm text-slate-500`}>
        JustStretch is a student project and is not a medical device. If a stretch causes sharp or worsening pain, stop and seek
        professional advice.
      </p>
    </PublicLayout>
  )
}
