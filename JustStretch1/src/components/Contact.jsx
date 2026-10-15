import { useState } from 'react'
import '../css/AboutContact.css'

const EMAIL = 'juststretch@gmail.com'

// There is no backend for this form yet, so submitting says so instead of pretending to send.
export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contact" className="contact-page">
      <div className="contact-intro">
        <h2>Get in touch.</h2>
        <p>Do you have questions about JustStretch or want to work together? Fill out the form below or send us an email.</p>
      </div>

      <div className="contact-content">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Your name" required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" rows="5" placeholder="How can we help?" required></textarea>
          </div>

          {submitted && (
            <p className="contact-note" role="status">
              This form isn&apos;t connected yet; email us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          )}

          <button type="submit" className="submit-btn">
            Send Message &rarr;
          </button>
        </form>

        <aside className="contact-info">
          <h3>Other ways to connect</h3>
          <p>
            <strong>Email</strong>
            <br />
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p>
            <strong>Location</strong>
            <br />
            Mandaluyong City, Philippines
          </p>
        </aside>
      </div>
    </section>
  )
}
