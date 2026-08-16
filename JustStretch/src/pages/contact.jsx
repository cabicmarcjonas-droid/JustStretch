import React, { useState } from "react";

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message Sent!");
  };

  return (
    <div className="contact-page">
      <section className="contact-intro">
        <h1>Get in touch.</h1>
        <p>
          Have questions about JustStretch or want to work together? Fill out
          the form below or send us an email.
        </p>
      </section>

      <div className="contact-content">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Your Name" required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              rows="5"
              placeholder="How can we help?"
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn">
            Send Message &rarr;
          </button>
        </form>

        <aside className="contact-info">
          <h3>Other ways to connect</h3>
          <p>
            <strong>Email</strong>
            <br />
            juststretch@gmail.com
          </p>
          <p>
            <strong>Location</strong>
            <br />
            Mandaluyong City, Philippines
          </p>
        </aside>
      </div>
    </div>
  );
}
