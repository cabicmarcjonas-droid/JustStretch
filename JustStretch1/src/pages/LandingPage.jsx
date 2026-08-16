import { Link } from "react-router-dom";
import { About, Contact } from "../components/AboutContact";
import "../css/LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-inner">
          <span className="logo">JustStretch</span>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link to="/login" className="login-link">Login</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <h1>Welcome to JustStretch</h1>
        <p>Stretch better. Move better. Feel better.</p>
        <Link to="/login" className="hero-cta">
          Get Started &rarr;
        </Link>
      </section>

      {/* About & Contact Section */}
      <About />
      <Contact />

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 JustStretch. Just a team with a big dream.</p>
      </footer>
    </div>
  );
}

export default LandingPage;