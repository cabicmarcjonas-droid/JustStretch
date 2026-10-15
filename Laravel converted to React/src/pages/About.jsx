import PublicLayout from '../layouts/PublicLayout.jsx'

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
]

export default function About() {
  return (
    <PublicLayout title="About">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20">
        <p className="text-sm font-medium text-accent tracking-wide uppercase">About the project</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold">Why Just Stretch exists</h1>
        <p className="mt-5 text-lg text-muted">
          Many people live with a stiff neck or a sore lower back for months because seeing a physiotherapist is expensive, far away, or
          hard to fit into a working week. Just Stretch is a small step toward closing that gap.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div>
          <h2 className="font-display text-2xl font-semibold">The problem</h2>
          <ul className="mt-4 space-y-3 text-muted list-disc ps-5">
            <li>Minor chronic muscle pain is common among students and desk workers, and it often goes untreated.</li>
            <li>
              Professional physiotherapy costs money and travel time that many people cannot spare for a &quot;minor&quot; ache.
            </li>
            <li>
              Following a stretch from a static picture or video gives no feedback, so people are never sure they are doing it right.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">Our approach</h2>
          <p className="mt-4 text-muted">
            Just Stretch offers a curated, community-maintained library of gentle stretches grouped by body area. When you start a
            session, your webcam feed is analysed in the browser by a pose-estimation model. The joints that matter for that stretch are
            highlighted, giving you a live mirror of your own posture. Afterwards you rate your form and the app keeps a simple history so
            you can see your consistency improve.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">Sustainable Development Goals</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {GOALS.map((goal) => (
              <div key={goal.n} className="rounded-2xl border border-line bg-white p-5">
                <p className="font-display text-3xl text-accent">{goal.n}</p>
                <p className="mt-1 font-semibold">{goal.title}</p>
                <p className="mt-2 text-sm text-muted">{goal.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">Built with</h2>
          <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
            {STACK.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-5 py-3">
                <dt className="font-medium">{label}</dt>
                <dd className="text-muted text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-6">
          <h2 className="font-display text-2xl font-semibold text-accent-dark">Your privacy</h2>
          <p className="mt-3 text-accent-dark/90">
            The pose model runs entirely inside your browser. Camera frames and body landmarks are never uploaded or stored. The only
            session data sent to our server is what you type or choose yourself: a form score, the session length and optional notes.
          </p>
        </div>

        <p className="text-sm text-muted">
          Just Stretch is a student project and is not a medical device. If a stretch causes sharp or worsening pain, stop and seek
          professional advice.
        </p>
      </section>
    </PublicLayout>
  )
}
