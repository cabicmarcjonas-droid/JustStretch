import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import exercises from "../data/exercises";
import Navbar from "../components/Navbar";
import "../css/ExercisePage.css";
import PoseTracker from "../components/PoseTracker";

function ExercisePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);

  const exercise = exercises.find((ex) => ex.id === parseInt(id));


  if (!exercise) {
    return (
      <div className="exercise-page">
        <div className="not-found">
          <p>Exercise not found.</p>
          <Link to="/main">Back to Main Page</Link>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    setIsActive(true);
  };

  const handleEnd = () => {
    setIsActive(false);
    navigate("/main");
  };

  return (
    <div className="exercise-page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar variant="exercise" exerciseTitle={exercise.title} />
      <div className="exercise-inner" id="main-content">
        <h1 className="text-balance break-words sr-only">{exercise.title}</h1>

        <div className="session-container">
          <div className="video-box">
            <h3>Tutorial</h3>
            <div className="media-frame">
              <video className="tutorial-video" controls width="640" height="360" preload="metadata" src={exercise.video}>
                <track kind="captions" label="English captions" srcLang="en" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="video-box">
            <h3>Webcam</h3>
            <PoseTracker />
          </div>
        </div>

        <p className="duration-text">Duration: {exercise.duration}</p>

        <div className="exercise-controls">
          <button className="start-btn" onClick={handleStart} disabled={isActive} aria-pressed={isActive}>
            Start
          </button>
          <button className="end-btn" onClick={handleEnd} disabled={!isActive}>
            End
          </button>
        </div>
        <p aria-live="polite" role="status" className="sr-only">{isActive ? "Session active" : "Session inactive"}</p>

        <div className="benefits">
          <h2>Benefits</h2>
          <ul>
            {exercise.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ExercisePage;