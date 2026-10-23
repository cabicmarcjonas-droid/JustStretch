import Icon from './Icon.jsx'
import { areaLabel } from '../lib/enums.js'
import { statLabel } from '../lib/ui.js'

// Shown when a saved session met the referral threshold (server/shared/referral.js).
// Just Stretch does not diagnose anything; it only points the member to a professional.
//
// referral: { reason, area, message, therapist: { name, clinic, phone, email, address, placeholder } | null }
export default function ReferralCard({ referral }) {
  if (!referral) return null
  const { therapist } = referral

  return (
    <section className="overflow-hidden rounded-lg border border-[#e9c98f] bg-surface" role="alert" aria-labelledby="referral-title">
      <div className="flex gap-3 bg-caution-soft px-5 py-4 text-caution">
        <Icon name="warn" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
        <div className="min-w-0">
          <h2 id="referral-title" className="text-base font-semibold">
            We recommend a professional assessment
          </h2>
          <p className="mt-1 text-sm leading-relaxed">
            {referral.message} A physical therapist can check your {areaLabel(referral.area).toLowerCase()} and adjust the
            stretches to you. Just Stretch does not diagnose conditions or replace clinical care.
          </p>
        </div>
      </div>

      {therapist ? (
        <div className="px-5 py-4">
          <p className={statLabel}>Physical therapist</p>
          <p className="mt-1 text-base font-semibold text-ink">{therapist.name}</p>
          <p className="text-sm text-muted">{therapist.clinic}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 border-t border-line pt-3 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <dt className={`${statLabel} leading-5`}>Tel</dt>
              <dd>
                <a href={`tel:${therapist.phone.replace(/\s/g, '')}`} className="font-mono text-accent hover:underline">
                  {therapist.phone}
                </a>
              </dd>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <dt className="sr-only">Email</dt>
              <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <dd className="min-w-0 break-words">
                <a href={`mailto:${therapist.email}`} className="font-medium text-accent hover:underline">
                  {therapist.email}
                </a>
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">Address</dt>
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <dd className="text-ink-2">{therapist.address}</dd>
            </div>
          </dl>
          {therapist.placeholder && <p className="mt-3 text-xs text-muted">Sample contact for the demo. This is not a real clinic.</p>}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-ink-2">No therapist is listed yet. Please contact a licensed physical therapist near you.</p>
      )}
    </section>
  )
}
