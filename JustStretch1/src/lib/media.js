import { hasPlayableVideo } from './enums.js'

// Poster frame for a bundled reference video: /videos/neck_side_tilt.mp4 -> /thumbs/neck_side_tilt.jpg.
// Other URLs (external links, uploads without a poster) return null and the UI shows a placeholder.
export function thumbnailFor(videoUrl) {
  if (!videoUrl || !hasPlayableVideo(videoUrl)) return null
  const match = /^\/videos\/([A-Za-z0-9_-]+)\.(mp4|webm|ogg|mov)$/i.exec(videoUrl)
  return match ? `/thumbs/${match[1]}.jpg` : null
}
