import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import exercises from "../data/exercises";
import "../css/ExercisePage.css";

function ExercisePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const webcamRef = useRef(null);
  const streamRef = useRef(null);

  const exercise = exercises.find((ex) => ex.id === parseInt(id));

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
      <div className="exercise-inner">
        <Link to="/main">
          <button className="back-btn">&larr; Back</button>
        </Link>

        <h1>{exercise.title}</h1>

        <div className="session-container">
          <div className="video-box">
            <h3>Tutorial</h3>
            <video className="tutorial-video" controls src={exercise.video}>
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="video-box">
            <h3>Webcam</h3>
            <video
              className="webcam-video"
              ref={webcamRef}
              autoPlay
              playsInline
            />
          </div>
        </div>

        <p className="duration-text">Duration: {exercise.duration}</p>

        <div className="exercise-controls">
          <button className="start-btn" onClick={handleStart} disabled={isActive}>
            Start
          </button>
          <button className="end-btn" onClick={handleEnd} disabled={!isActive}>
            End
          </button>
        </div>

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