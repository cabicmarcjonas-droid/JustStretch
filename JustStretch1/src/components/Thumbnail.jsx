import { useState } from 'react'
import { thumbnailFor } from '../lib/media.js'

const CameraIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
)

// Poster frame from the exercise's reference video, or a grey placeholder when there is none.
// `label` shows "Video coming soon" on large placeholders; small ones only show the icon.
export default function Thumbnail({ videoUrl, className = '', label = false, children }) {
  const src = thumbnailFor(videoUrl)
  // Remember which src failed, so a reused component with a new video tries again.
  const [failedSrc, setFailedSrc] = useState(null)

  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      {src && failedSrc !== src ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
          <CameraIcon className={label ? 'h-7 w-7' : 'h-5 w-5'} />
          {label && <span className="text-sm font-medium">No video yet</span>}
        </div>
      )}
      {children}
    </div>
  )
}
