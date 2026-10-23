import Team from '../components/Team.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'

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
]

const h2 = 'text-2xl font-black italic tracking-tighter text-slate-900'
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

export default function About() {
  return (
    <PublicLayout title="About">
      <section className="mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-20">
        <h1 className="mb-6 text-5xl font-black italic tracking-tighter text-slate-900">About JustStretch</h1>
        <p className="text-lg leading-relaxed text-slate-600">
          Many people live with a stiff neck or a sore lower back for months because seeing a physiotherapist is expensive, far away, or
          hard to fit into a working week. Just Stretch is a small step toward closing that gap.
        </p>
      </section>

      <section className="mx-auto max-w-3xl space-y-12 px-6 py-10">
        <div>
          <h2 className={h2}>The problem</h2>
          <ul className="mt-4 list-disc space-y-3 ps-5 text-slate-600">
            <li>Minor chronic muscle pain is common among students and desk workers, and it often goes untreated.</li>
            <li>Professional physiotherapy costs money and travel time that many people cannot spare for a &quot;minor&quot; ache.</li>
            <li>Following a stretch from a static picture or video gives no feedback, so people are never sure they are doing it right.</li>
          </ul>
        </div>

        <div>
          <h2 className={h2}>Our approach</h2>
          <p className="mt-4 text-slate-600">
            Just Stretch offers a curated, community-maintained library of gentle stretches grouped by body area. When you start a
            session, your webcam feed is analysed in the browser by a pose-estimation model. The joints that matter for that stretch are
            highlighted, giving you a live mirror of your own posture. Afterwards you rate your form and the app keeps a simple history so
            you can see your consistency improve.
          </p>
        </div>

        <div>
          <h2 className={h2}>Sustainable Development Goals</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {GOALS.map((goal) => (
              <div key={goal.n} className={card}>
                <p className="text-3xl font-black italic tracking-tighter text-emerald-600">{goal.n}</p>
                <p className="mt-1 font-bold">{goal.title}</p>
                <p className="mt-2 text-sm text-slate-600">{goal.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className={h2}>Built with</h2>
          <dl className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white text-sm shadow-sm">
            {STACK.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-5 py-3">
                <dt className="font-bold">{label}</dt>
                <dd className="text-right text-slate-600">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-2xl font-black italic tracking-tighter text-emerald-800">Your privacy</h2>
          <p className="mt-3 text-emerald-900/90">
            The pose model runs entirely inside your browser. Camera frames and body landmarks are never uploaded or stored. The only
            session data sent to our server is what you type or choose yourself: a form score, the session length and optional notes.
          </p>
        </div>
      </section>

      <Team />

      <p className="mx-auto max-w-3xl px-6 pb-16 text-sm text-slate-500">
        Just Stretch is a student project and is not a medical device. If a stretch causes sharp or worsening pain, stop and seek
        professional advice.
      </p>
    </PublicLayout>
  )
}
