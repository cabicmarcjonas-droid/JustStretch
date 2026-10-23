import { hasPlayableVideo } from '../lib/enums.js'
import { thumbnailFor } from '../lib/media.js'
import Icon from './Icon.jsx'

// The reference video, or a placeholder when there is none (or it is not a playable file).
export default function VideoPanel({ url }) {
  if (url && hasPlayableVideo(url)) {
    return (
      <video
        src={url}
        poster={thumbnailFor(url) ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-3xl border border-slate-300 bg-ink shadow-card"
      />
    )
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-3xl border border-slate-300 bg-accent-soft px-6 text-center shadow-card">
      <Icon name="camera" className="h-10 w-10 text-accent" strokeWidth={1.4} />
      {url ? (
        <>
          <p className="mt-3 font-bold">Demo video</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 break-all text-sm font-bold text-accent underline underline-offset-2">
            Watch on the original site
          </a>
        </>
      ) : (
        <>
          <p className="mt-3 font-bold">Demo video coming soon</p>
          <p className="mt-1 text-sm text-slate-600">Follow the written steps below in the meantime.</p>
        </>
      )}
    </div>
  )
}
