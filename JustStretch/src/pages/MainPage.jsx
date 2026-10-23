import { Link } from "react-router-dom";
import exercises from "../data/exercises";
import Navbar from "../components/Navbar";
import "../css/MainPage.css";
import { About, Contact } from "../components/AboutContact";

function MainPage() {
  return (
    <div className="main-page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar variant="app" />

      {/* Hero Section */}
      <section id="main-content" className="main-hero">
        <span className="eyebrow">Session &middot; Wednesday</span>
        <h1>Welcome back.</h1>
        <p>Today's routine is three stretches, about 12 minutes.</p>
        <a href="#workouts" className="main-cta">Start today's routine &rarr;</a>
      </section>

      {/* Workout Cards Section */}
      <section id="workouts" className="workouts-section">
        <div className="section-label">
          <span className="eyebrow">Today's routine</span>
          <span className="count">{String(exercises.length).padStart(2, "0")} exercises</span>
        </div>
        <div className="card-container">
          {exercises.map((ex, i) => (
            <Link to={`/exercise/${ex.id}`} key={ex.id} className="card min-w-0">
              <span className="card-index tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="truncate text-balance">{ex.title}</h3>
              <p className="truncate">{ex.duration}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Streak Tracker Section */}
      <section id="streak" className="streak-section">
        <span className="eyebrow">Streak</span>
        <p className="streak-number tabular-nums">5<span>days</span></p>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <span className="eyebrow">Why it works</span>
        <h2>Benefits</h2>
        <ul>
          <li><span>01</span>Improves flexibility</li>
          <li><span>02</span>Reduces stress</li>
          <li><span>03</span>Boosts energy</li>
        </ul>
      </section>

      {/* About & Contact Section */}
      <About />
      <Contact />

      {/* Footer */}
      <footer className="main-footer">
        <p>Just Stretch &mdash; Group 6, ITC C301-302I</p>
      </footer>
    </div>
  );
}

export default MainPage;
