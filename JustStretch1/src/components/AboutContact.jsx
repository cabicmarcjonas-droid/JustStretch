import "../css/AboutContact.css";

const team = [
  { 
    name: "Cabic, Marc Jonas", 
    role: "lorem" 
  },
  { 
    name: "Estallo, Joseph Miguel", 
    role: "lorem" 
  },
  { 
    name: "Mendoza, Patrick",
     role: "lorem" 
  },
  { 
    name: "Resultay, Gabriel",
     role: "lorem" 
  },
];

function About() {
  return (
    <section id="about" className="about-page">
      <div className="about-intro">
        <h1>About JustStretch</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Id facere
          porro quam eos, voluptatum nisi quidem? Assumenda obcaecati mollitia
          vitae dignissimos eveniet, sapiente doloremque aspernatur adipisci
          praesentium earum nostrum exercitationem?
        </p>
      </div>

      <div className="team-members">
        <h2>Meet our Team</h2>
        <div className="team-grid">
          {team.map((person) => (
            <div className="team-card" key={person.name}>
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
