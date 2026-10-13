import { useEffect, useRef, useState } from "react";
import{FilesetResolver, PoseLandmarker } from"@mediapipe/tasks-vision";
import { useCamera } from "../hooks/useCamera";

export default function PoseTracker(){
  const { videoRef, ready } = useCamera();
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init(){
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO", numPoses: 1,});
      setLoading(false);
    }
    init(); }, []);

  useEffect(() => {
    if (!ready || loading) return;
    let animationId;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d"); //ETO UNG GREEN NA TULDOK SA JOINTS, PERO DI SIYA UNG NAGDDETECT

    const detect = () => {
      if (video.readyState >= 2) {
        const result = landmarkerRef.current.detectForVideo(
          video, performance.now() ); //ETO UNG NADEDETECT

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        result.landmarks?.forEach((landmarks) => {
          landmarks.forEach((lm) => {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "lime";
            ctx.fill();
          });});}
      animationId = requestAnimationFrame(detect);
    };
    detect();
    return () => cancelAnimationFrame(animationId);
  }, [ready, loading]);

  return (
    <div className="media-frame">
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={canvasRef} width={640} height={480} className="webcam-canvas" />
      {loading && (
        <div className="webcam-skeleton" aria-live="polite">
          <p>Loading pose model…</p>
        </div>
      )}
    </div>
  );
}