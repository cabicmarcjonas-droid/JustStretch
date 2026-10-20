import { useState } from 'react'
import { IconTile } from './Icon.jsx'
import { btn, container, eyebrow, input, label, panel, textarea } from '../lib/ui.js'

const EMAIL = 'juststretch@gmail.com'

// There is no backend for this form yet, so submitting says so instead of pretending to send.
export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contact" className={`${container} grid scroll-mt-20 gap-12 pb-20 pt-16 lg:grid-cols-[1fr_640px] lg:gap-16`}>
      <div>
        <p className={eyebrow}>Contact</p>
        <h2 className="mt-2 text-4xl font-black italic tracking-tighter">Get in touch.</h2>
        <p className="mt-4 max-w-md leading-relaxed text-slate-600">
          Questions about JustStretch, or want to work together? Send us a message and we will get back to you.
        </p>
        <dl className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <IconTile name="mail" size="h-10 w-10" />
            <div>
              <dt className="text-[13px] font-bold text-slate-500">Email</dt>
              <dd className="font-semibold">
                <a href={`mailto:${EMAIL}`} className="hover:text-accent">
                  {EMAIL}
                </a>
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <IconTile name="pin" size="h-10 w-10" />
            <div>
              <dt className="text-[13px] font-bold text-slate-500">Location</dt>
              <dd className="font-semibold">Mandaluyong City, Philippines</dd>
            </div>
          </div>
        </dl>
      </div>

      <form className={`${panel} space-y-5 p-6 sm:p-8`} onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className={label}>
              Name
            </label>
            <input type="text" id="name" placeholder="Your name" required className={input} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className={label}>
              Email
            </label>
            <input type="email" id="email" placeholder="you@example.com" required className={input} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="message" className={label}>
            Message
          </label>
          <textarea id="message" rows="5" placeholder="How can we help?" required className={textarea}></textarea>
        </div>

        {submitted && (
          <p className="rounded-xl border border-emerald-200 bg-accent-soft px-4 py-3 text-sm font-medium text-emerald-900" role="status">
            This form isn&apos;t connected yet; email us at{' '}
            <a href={`mailto:${EMAIL}`} className="font-bold underline">
              {EMAIL}
            </a>
            .
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-slate-500">We usually reply within 2 days.</p>
          <button type="submit" className={`${btn.primary} ${btn.lg}`}>
            Send message
          </button>
        </div>
      </form>
    </section>
  )
}
