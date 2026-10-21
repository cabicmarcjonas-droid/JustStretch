import Icon from './Icon.jsx'
import { areaLabel } from '../lib/enums.js'

// Shown when a saved session met the referral threshold (server/shared/referral.js).
// Just Stretch does not diagnose anything; it only points the member to a professional.
//
// referral: { reason, area, message, therapist: { name, clinic, phone, email, address, placeholder } | null }
export default function ReferralCard({ referral }) {
  if (!referral) return null
  const { therapist } = referral

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950" role="alert" aria-labelledby="referral-title">
      <div className="flex gap-3">
        <Icon name="info" className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <h2 id="referral-title" className="text-xl font-black italic tracking-tighter">
            We recommend a professional assessment
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed">
            {referral.message} A physical therapist can check your {areaLabel(referral.area).toLowerCase()} and adjust the
            stretches to you. Just Stretch does not diagnose conditions or replace clinical care.
          </p>

          {therapist ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-ink">
              <p className="text-lg font-bold">{therapist.name}</p>
              <p className="text-sm text-slate-600">{therapist.clinic}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 leading-5">Tel</dt>
                  <dd>
                    <a href={`tel:${therapist.phone.replace(/\s/g, '')}`} className="font-semibold text-accent-dark hover:underline">
                      {therapist.phone}
                    </a>
                  </dd>
                </div>
                <div className="flex min-w-0 items-start gap-2">
                  <dt className="sr-only">Email</dt>
                  <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <dd className="min-w-0 break-words">
                    <a href={`mailto:${therapist.email}`} className="font-semibold text-accent-dark hover:underline">
                      {therapist.email}
                    </a>
                  </dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="sr-only">Address</dt>
                  <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <dd>{therapist.address}</dd>
                </div>
              </dl>
              {therapist.placeholder && (
                <p className="mt-3 text-xs text-slate-500">Sample contact for the demo. This is not a real clinic.</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm">No therapist is listed yet. Please contact a licensed physical therapist near you.</p>
          )}
        </div>
      </div>
    </section>
  )
}
