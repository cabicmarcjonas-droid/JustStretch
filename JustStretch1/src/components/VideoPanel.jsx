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
        className="aspect-video w-full rounded-lg border border-line bg-ink"
      />
    )
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-line bg-paper-2 px-6 text-center">
      <Icon name="camera" className="h-9 w-9 text-muted" strokeWidth={1.4} />
      {url ? (
        <>
          <p className="mt-3 font-semibold">Demo video</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 break-all text-sm font-medium text-accent underline underline-offset-2">
            Watch on the original site
          </a>
        </>
      ) : (
        <>
          <p className="mt-3 font-semibold">No reference video yet</p>
          <p className="mt-1 text-sm text-muted">Follow the written steps below in the meantime.</p>
        </>
      )}
    </div>
  )
}
