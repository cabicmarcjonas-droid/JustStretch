import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Contact from '../components/Contact.jsx'
import Icon, { IconTile, PrivacyBand } from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { btn, card, container, eyebrow, panel, sectionTitle } from '../lib/ui.js'

const STEPS = [
  { icon: 'search', title: 'Pick what hurts', body: 'Filter the library by body area and difficulty to find a stretch that fits how you feel today.' },
  { icon: 'camera', title: 'Stretch on camera', body: 'Follow the 3D guide while a live skeleton highlights the joints that matter for that stretch.' },
  { icon: 'chart', title: 'Track your progress', body: 'Every session is scored. Your dashboard shows minutes stretched, your streak, and how your form improves.' },
]

const FEATURES = [
  { icon: 'book', title: 'A growing library', body: 'Stretches for the neck, back, hips, legs and wrists, each with steps, benefits and safety notes.' },
  { icon: 'camera', title: 'Live pose tracking', body: 'MediaPipe runs in your browser and draws your skeleton in real time, emphasising the target joints.' },
  { icon: 'users', title: 'Community contributed', body: 'Any member can add a stretch. Only the author can edit or remove it, so entries stay trustworthy.' },
]

// Stylised webcam view for the hero: silhouette plus skeleton, target joints in green, one off-target joint ringed.
function CameraArt() {
  const J = { n: [344, 140], le: [312, 124], re: [374, 140], ls: [236, 220], rs: [428, 204], lel: [206, 322], rel: [456, 312], lw: [212, 412], rw: [448, 404] }
  const line = (a, b, color, w) => <line x1={J[a][0]} y1={J[a][1]} x2={J[b][0]} y2={J[b][1]} stroke={color} strokeWidth={w} strokeLinecap="round" />
  const dot = (a, color, r) => <circle cx={J[a][0]} cy={J[a][1]} r={r} fill={color} stroke="#fff" strokeWidth="2" />
  return (
    <svg viewBox="80 40 480 440" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="0" y="0" width="640" height="480" fill="#0f172a" />
      <g fill="#475569" fillOpacity="0.55">
        <ellipse cx="342" cy="132" rx="46" ry="56" transform="rotate(14 342 132)" />
        <path d="M296 186 C300 196 318 200 330 198 C350 196 360 192 368 186 C392 190 420 192 440 206 C470 228 478 300 482 360 L488 480 L168 480 L176 360 C180 300 190 236 222 214 C244 200 272 192 296 186 Z" />
      </g>
      {line('ls', 'lel', '#94a3b8', 4)}
      {line('lel', 'lw', '#94a3b8', 4)}
      {line('rs', 'rel', '#94a3b8', 4)}
      {line('rel', 'rw', '#94a3b8', 4)}
      {line('ls', 'rs', '#34d399', 6)}
      {line('le', 'n', '#34d399', 6)}
      {line('n', 're', '#34d399', 6)}
      <circle cx={J.rs[0]} cy={J.rs[1]} r="20" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 5" />
      {dot('lel', '#94a3b8', 6)}
      {dot('rel', '#94a3b8', 6)}
      {dot('n', '#34d399', 10)}
      {dot('le', '#34d399', 10)}
      {dot('re', '#34d399', 10)}
      {dot('ls', '#34d399', 10)}
      {dot('rs', '#f59e0b', 11)}
    </svg>
  )
}

function ProductPreview() {
  return (
    <div className={`${panel} p-4 shadow-xl`} aria-hidden="true">
      <div className="flex items-center justify-between px-1 pb-3">
        <p className="text-sm">
          <span className="font-black italic tracking-tighter">Neck Side Tilt</span>
          <span className="ms-2 text-xs font-medium text-slate-500">Step 2 of 4</span>
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tabular-nums">01:24</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative aspect-[278/300] overflow-hidden rounded-2xl bg-slate-200">
          <img src="/thumbs/neck_side_tilt.jpg" alt="" className="h-full w-full object-cover" />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-sm">Follow along</span>
        </div>
        <div className="relative aspect-[278/300] overflow-hidden rounded-2xl bg-slate-900">
          <CameraArt />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-sm">You</span>
          <span className="absolute right-2.5 top-2.5 rounded-xl bg-white px-2.5 py-1 text-right shadow-lg">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Live form</span>
            <span className="block text-2xl font-black italic leading-7 tracking-tighter text-accent">86</span>
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
        <span className="font-bold text-accent">2</span>
        <span className="flex-1 font-semibold">Tilt your right ear toward your right shoulder</span>
      </div>
    </div>
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
            Free · runs in your browser
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[64px]">
            Stretch better.
            <br />
            Move better.
            <br />
            Feel better.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Follow a 3D guide, stretch in front of your webcam, and get live feedback on your form. No equipment and no appointment
            needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={user ? '/dashboard' : '/register'} className={`${btn.primary} ${btn.lg}`}>
              {user ? 'Go to your dashboard' : 'Get started free'}
            </Link>
            <a href="#how-it-works" className={`${btn.secondary} ${btn.lg}`}>
              See how it works
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Icon name="lock" className="h-4 w-4" />
            Your video never leaves your device
          </p>
        </div>
        <ProductPreview />
      </section>

      <section id="how-it-works" className={`${container} scroll-mt-20 py-14`}>
        <p className={eyebrow}>How it works</p>
        <h2 className={`mt-2 ${sectionTitle} sm:text-3xl`}>Three steps, about five minutes</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className={`${card} p-6 sm:p-7`}>
              <div className="flex items-center justify-between">
                <IconTile name={step.icon} />
                <span className="text-3xl font-black italic tracking-tighter text-emerald-200">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${container} py-14`}>
        <p className={eyebrow}>What you get</p>
        <h2 className={`mt-2 ${sectionTitle} sm:text-3xl`}>Built for everyday aches</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <IconTile name={feature.icon} size="h-10 w-10" />
              <div>
                <h3 className="text-[17px] font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${container} py-6`}>
        <PrivacyBand />
      </section>

      <Contact />
    </PublicLayout>
  )
}
