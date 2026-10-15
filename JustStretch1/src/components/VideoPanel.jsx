import { hasPlayableVideo } from '../lib/enums.js'

// The reference video, or a placeholder when there is none (or it is not a playable file).
export default function VideoPanel({ url }) {
  if (url && hasPlayableVideo(url)) {
    return <video src={url} controls playsInline preload="metadata" className="w-full aspect-video rounded-2xl border border-line bg-ink" />
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-line bg-white text-center px-6">
      <svg className="h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
      {url ? (
        <>
          <p className="mt-3 font-medium">Demo video</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-accent underline underline-offset-2 break-all">
            Watch on the original site
          </a>
        </>
      ) : (
        <>
          <p className="mt-3 font-medium">Demo video coming soon</p>
          <p className="mt-1 text-sm text-muted">Follow the written steps below in the meantime.</p>
        </>
      )}
    </div>
  )
}
