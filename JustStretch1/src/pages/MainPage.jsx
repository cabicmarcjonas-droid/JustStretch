import { Link } from "react-router-dom";
import exercises from "../data/exercises";
import "../css/MainPage.css";
import { About, Contact } from "../components/AboutContact";

function MainPage() {
  return (
    <div className="main-page">
      {/* Navbar */}
      <nav className="main-navbar">
        <div className="navbar-inner">
          <span className="logo">JustStretch</span>
          <ul>
            <li><a href="#hero">Get Started</a></li>
            <li><a href="#streak">Streak</a></li>
            <li><a href="#benefits">Benefits</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="main-hero">
        <h1>Welcome back!</h1>
        <p>Ready for today's stretch?</p>
        <button>Get Started &rarr;</button>
      </section>

      {/* Workout Cards Section */}
      <section id="workouts" className="workouts-section">
        <h2>Today's Routine</h2>
        <div className="card-container">
          {exercises.map((ex) => (
            <Link to={`/exercise/${ex.id}`} key={ex.id}>
              <div className="card">
                <h3>{ex.title}</h3>
                <p>{ex.duration}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Streak Tracker Section */}
      <section id="streak" className="streak-section">
        <h2>Streak Tracker</h2>
        <p>5 days</p>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <h2>Benefits</h2>
        <ul>
          <li>Improves flexibility</li>
          <li>Reduces stress</li>
          <li>Boosts energy</li>
        </ul>
      </section>

      {/* About & Contact Section */}
      <About />
      <Contact />

      {/* Footer */}
      <footer className="main-footer">
        <p>&copy; 2026 JustStretch. Just a team with a big dream.</p>
      </footer>
    </div>
  );
}

export default MainPage;