import React from "react";
import tutorialVideo from "../assets/WIN_20241017_14_23_13_Pro.mp4";

const Session = () => {
  const startVideo = async (videoElement) => {
    if (videoElement && !videoElement.srcObject) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoElement.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }
  };

  return (
    <div
      className="session-container"
      style={{
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div className="video-box" style={{ width: "450px" }}>
        <h3>Video</h3>
        <video
          className="tutorial-video"
          controls
          src={tutorialVideo}
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="video-box" style={{ width: "450px" }}>
        <h3>Webcam</h3>
        <video
          className="webcam-video"
          ref={startVideo}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
            borderRadius: "8px",
            background: "#000",
            transform: "scaleX(-1)",
          }}
        />
      </div>
    </div>
  );
};

export default Session;
