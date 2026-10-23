import { useState } from 'react'
import { btn, card, container, eyebrow, h2, input, label, lede, statLabel, textarea } from '../lib/ui.js'

const EMAIL = 'juststretch@gmail.com'

// There is no backend for this form yet, so submitting says so instead of pretending to send.
export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contact" className="scroll-mt-20 border-t border-line">
      <div className={`${container} grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_600px] lg:gap-16`}>
        <div>
          <p className={eyebrow}>Contact</p>
          <h2 className={`mt-3 ${h2}`}>Get in touch.</h2>
          <p className={`mt-5 max-w-md ${lede}`}>Questions about JustStretch, or want to work together? Send us a message.</p>
          <dl className="mt-8 max-w-md border-t border-line">
            <div className="flex justify-between gap-4 border-b border-line py-3">
              <dt className={statLabel}>Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="font-medium text-accent hover:underline">
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-3">
              <dt className={statLabel}>Location</dt>
              <dd className="font-medium">Mandaluyong City, Philippines</dd>
            </div>
          </dl>
        </div>

        <form className={`${card} space-y-5 p-6`} onSubmit={handleSubmit}>
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
            <p className="rounded-md border border-accent-mid bg-accent-soft px-4 py-3 text-sm font-medium text-accent-dark" role="status">
              This form isn&apos;t connected yet; email us at{' '}
              <a href={`mailto:${EMAIL}`} className="font-semibold underline">
                {EMAIL}
              </a>
              .
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted">We usually reply within 2 days.</p>
            <button type="submit" className={`${btn.primary} ${btn.md}`}>
              Send message
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
