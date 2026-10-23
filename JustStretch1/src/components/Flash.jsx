import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { on } from '../lib/eventBus.js'
import { container } from '../lib/ui.js'

// Flash messages reach a page through router state (`navigate(path, { state: { flash } })`)
// or, for in-page actions, through the event bus (`emit('flash', message)`).
export default function Flash() {
  const location = useLocation()
  const navigate = useNavigate()
  const [flash, setFlash] = useState(() => (location.state?.flash ? { text: location.state.flash, id: 0 } : null))

  // Router state survives a reload; clear it so the message shows once, like Laravel's session flash.
  useEffect(() => {
    if (location.state?.flash) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
    // Run once per mount: the message was captured in state above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => on('flash', (text) => setFlash({ text, id: Date.now() })), [])

  if (!flash) return null
  return <FlashMessage key={flash.id} text={flash.text} onClose={() => setFlash(null)} />
}

function FlashMessage({ text, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true))
    const hide = setTimeout(() => setVisible(false), 4000)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(hide)
    }
  }, [])

  // Unmount once the fade-out has finished.
  useEffect(() => {
    if (visible) return undefined
    const done = setTimeout(onClose, 4300)
    return () => clearTimeout(done)
  }, [visible, onClose])

  return (
    <div
      className={`${container} mt-6 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="status"
    >
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-dark">
        <p>{text}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-lg leading-none text-accent-dark/70 hover:text-accent-dark"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
