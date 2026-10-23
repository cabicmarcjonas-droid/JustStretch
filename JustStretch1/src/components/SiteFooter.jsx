import { container } from '../lib/ui.js'
import { Wordmark } from './Mark.jsx'

// Public footer (Ft4): the wordmark over one dense block of small mono text.
export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className={`${container} py-10`}>
        <Wordmark size="sm" />
        <p className="mt-4 max-w-[60rem] text-[13px] leading-relaxed text-muted">
          JustStretch is a student research project and is not a medical device. It does not diagnose, treat or replace a licensed
          physical therapist. Pose estimation: MediaPipe Pose and Hand Landmarker, run in the browser. Reference motions: animated in
          Blender and exported as joint-angle data. Personal data is handled under the Data Privacy Act of 2012 (Republic Act No.
          10173); only scores, durations, notes and the profile details you enter are stored. Contact: juststretch@gmail.com,
          Mandaluyong City, Philippines. © 2026 JustStretch team.
        </p>
      </div>
    </footer>
  )
}
