import "../css/AboutContact.css";

import marcImage from "../assets/team_img/Cabic.jpg";
import migsImage from "../assets/team_img/Estallo.png";
import patrickImage from "../assets/team_img/Mendoza.jpg";
import gabrielImage from "../assets/team_img/Resultay.png";

const team = [
  {
    name: "Cabic, Marc Jonas",
    role: "Frontend & Interface",
    image: marcImage,
  },
  {
    name: "Estallo, Joseph Miguel",
    role: "Content & Assets",
    image: migsImage,
  },
  {
    name: "Mendoza, Patrick",
    role: "Computer Vision",
    image: patrickImage,
  },
  {
    name: "Resultay, Gabriel",
    role: "Pose Analysis & Backend",
    image: gabrielImage,
  },
];

function About() {
  return (
    <section id="about" className="about-page">
      <div className="section-head">
        <span className="eyebrow">01 &mdash; About</span>
        <h1>About JustStretch</h1>
        <p>
           At Just Stretch, we make professional-grade physical rehabilitation accessible
            and affordable for everyone. Our free, open-source web application uses real-time
            computer vision to turn a standard webcam into a personal guide, providing instant 
            form feedback to ensure safe and effective recovery at home. By combining gamified 
            progress tracking with seamless referrals to professional therapists when needed, 
            we remove the traditional barriers to consistent care and empower you to take 
            control of your muscle health.
        </p>
      </div>

      <div className="team-members">
        <span className="eyebrow">Team</span>
        <div className="team-grid">
          {team.map((person, i) => (
            <div className="team-card" key={person.name}>
              <span className="team-index">{String(i + 1).padStart(2, "0")}</span>
              {person.image && (
                <img src={person.image} alt={person.name} className="team-image" width="300" height="300" loading="lazy" decoding="async" />
              )}
              <h3 className="truncate">{person.name}</h3>
              <strong className="break-words">{person.role}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    if (status) status.textContent = "Message sent — we’ll reply soon.";
  };

  return (
    <section id="contact" className="contact-page">
      <div className="section-head">
        <span className="eyebrow">02 &mdash; Contact</span>
        <h1>Get in touch</h1>
        <p>
          Questions about Just Stretch, or want to work together? Fill out
          the form or reach us directly.
        </p>
      </div>

      <div className="contact-content">
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" autoComplete="name" placeholder="Juan Dela Cruz…" required className="min-w-0" spellCheck={false} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              placeholder="juandelacruz@gmail.com…"
              required
              className="min-w-0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              placeholder="How can we help? …"
              required
              className="min-w-0 break-words"
            ></textarea>
          </div>

          <button type="submit" className="submit-btn">
            Send message &rarr;
          </button>
          <p id="form-status" aria-live="polite" role="status" className="font-body text-xs text-accent min-h-[1rem]"></p>
        </form>

        <aside className="contact-info">
          <div className="info-item">
            <strong>Email</strong>
            <span>juststretch@gmail.com</span>
          </div>
          <div className="info-item">
            <strong>Location</strong>
            <span>Mandaluyong City, Philippines</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export { About, Contact };
