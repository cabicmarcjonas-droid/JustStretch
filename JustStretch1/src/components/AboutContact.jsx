import "../css/AboutContact.css";

import marcImage from "../assets/team_img/Cabic.jpg";
import migsImage from "../assets/team_img/Estallo.png";
import patrickImage from "../assets/team_img/Mendoza.jpg";
import gabrielImage from "../assets/team_img/Resultay.png";

  const team = [
    { 
      name: "Cabic, Marc Jonas", 
      role: "Frontend and User Interface Developer",
      image: marcImage
    },
    { 
      name: "Estallo, Joseph Miguel", 
      role: "Content Creation & Asset Management",
      image: migsImage
    },
    { 
      name: "Mendoza, Patrick",
      role: "Computer Vision and Pose Tracking Developer",
      image: patrickImage
    },
    { 
      name: "Resultay, Gabriel",
      role: "Pose Analysis and Backend Developer",
      image: gabrielImage
    },
  ];

  function About() {
    return (
      <section id="about" className="about-page">
        <div className="about-intro">
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
          <h2>Meet our Team</h2>
          <div className="team-grid">
            {team.map((person) => (
              <div className="team-card" key={person.name}>
                {person.image && (
                  <img 
                    src={person.image} 
                    alt={person.name} 
                    className="team-image"
                  />
                )}
                <h3>{person.name}</h3>
                <strong>{person.role}</strong>
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
      alert("Message Sent");
    };

    return (
      <section id="contact" className="contact-page">
        <div className="contact-intro">
          <h1>Get in touch.</h1>
          <p>
            Do you have questions about JustStretch or want to work together? Fill
            out the form below or send us an email.
          </p>
        </div>

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
                placeholder="JuanDelaCruz@gmail.com"
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
      </section>
    );
  }

  export { About, Contact };
