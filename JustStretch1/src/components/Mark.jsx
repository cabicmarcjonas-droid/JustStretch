// The JustStretch mark: a joint and the angle it makes, on the accent square.
export default function Mark({ className = 'h-7 w-7' }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="7" className="fill-accent" />
      <path d="M8 21L14 9L21 15" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.3 14.4A4 4 0 0 0 16.2 11.4" className="stroke-accent-mid" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="9" r="2.2" fill="#fff" />
    </svg>
  )
}

// Mark plus the name, used in the navs and footers.
export function Wordmark({ size = 'md' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark className={size === 'sm' ? 'h-[22px] w-[22px]' : 'h-7 w-7'} />
      <span className={`font-semibold tracking-[-0.02em] text-ink ${size === 'sm' ? 'text-base' : 'text-[19px]'}`}>JustStretch</span>
    </span>
  )
}
