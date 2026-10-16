import { useEffect, useRef } from 'react'

const MAX_WIDTH = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

const FOCUSABLE = 'a, button, input:not([type="hidden"]), textarea, select, details, [tabindex]:not([tabindex="-1"])'

export default function Modal({ show, onClose, maxWidth = '2xl', children }) {
  const panel = useRef(null)

  useEffect(() => {
    if (!show) return undefined

    document.body.classList.add('overflow-y-hidden')
    const previous = document.activeElement
    const focusables = () => [...panel.current.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled)
    const focusTimer = setTimeout(() => focusables()[0]?.focus(), 100)

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'Tab') {
        // Keep focus inside the dialog.
        const items = focusables()
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('overflow-y-hidden')
      previous?.focus?.()
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 transform transition-all" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-500 opacity-75" />
      </div>

      <div
        ref={panel}
        className={`mb-6 bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:w-full ${MAX_WIDTH[maxWidth]} sm:mx-auto`}
      >
        {children}
      </div>
    </div>
  )
}
