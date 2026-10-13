import { Link } from "react-router-dom";
import { About, Contact } from "../components/AboutContact";
import Navbar from "../components/Navbar";
import "../css/LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page" id="top">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar variant="landing" />

      {/* Hero Section — image removed, centered introductory message */}
      <section id="main-content" className="hero-section hero-section--intro">
        <div className="hero-copy">
          <span className="eyebrow">Guided rehab, from your webcam</span>
          <h1>Welcome to JustStretch</h1>
          <p>
            Stretch better. Move better. Feel better.
          </p>
          <Link to="/login" className="hero-cta">
            Start a session &rarr;
          </Link>
        </div>
      </section>

      {/* About & Contact Section */}
      <About />
      <Contact />

      {/* Footer */}
      <footer className="landing-footer">
        <p>Just Stretch | Group 6, ITC C301-302I</p>
      </footer>
    </div>
  );
}

export default LandingPage;
