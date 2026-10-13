import { useEffect, useRef, useState } from "react";

let sharedStreamPromise = null;
let activeUsers = 0;
let teardownTimer = null;

export function useCamera() {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    activeUsers++;

    // Cancel any pending teardown from a previous rapid unmount
    if (teardownTimer) {
      clearTimeout(teardownTimer);
      teardownTimer = null;
    }

    if (!sharedStreamPromise) {
      sharedStreamPromise = navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
    }

    sharedStreamPromise
      .then((stream) => {
        if (cancelled) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          return videoRef.current.play();
        }
      })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => console.error("Camera error:", err));

    return () => {
      cancelled = true;
      activeUsers--;

      // Wait briefly before actually releasing — gives StrictMode's
      // immediate remount a chance to cancel this teardown
      teardownTimer = setTimeout(() => {
        if (activeUsers === 0 && sharedStreamPromise) {
          sharedStreamPromise.then((stream) =>
            stream.getTracks().forEach((t) => t.stop())
          );
          sharedStreamPromise = null;
        }
      }, 10000);
    };
  }, []);

  return { videoRef, ready };
}