export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" />
      <circle cx="23" cy="10.5" r="3" fill="currentColor" />
      <path
        d="M12 30c4-1.5 6.5-5 7.5-9.5l1-4.5M20.5 16l7 5M20.5 16l-6.5 1.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
