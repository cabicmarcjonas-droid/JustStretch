// Shared class strings for the clinical look, so every page uses the same container,
// surfaces, type and controls.

// 1312px of content on public pages, with side padding on smaller screens.
export const container = 'mx-auto w-full max-w-[86rem] px-4 sm:px-8'
// App pages sit beside the side rail, so they only need padding.
export const appMain = 'w-full px-4 py-6 sm:px-8 lg:px-10 lg:py-8'

// Flat surfaces: 8px radius, 1px rule, no shadow.
export const card = 'rounded-lg border border-line bg-surface'
export const panel = card
// A card's grey header strip.
export const cardHead = 'border-b border-line bg-paper-2 px-5 py-3.5'

export const pageTitle = 'text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]'
export const displayTitle = 'text-[40px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[56px]'
export const h2 = 'text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[40px]'
export const sectionTitle = 'text-base font-semibold text-ink'
export const eyebrow = 'font-mono text-xs font-medium uppercase tracking-[0.04em] text-accent'
export const statLabel = 'font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-muted'
export const lede = 'text-[17px] leading-relaxed text-ink-2'
export const link = 'font-medium text-accent underline underline-offset-2 hover:text-accent-dark'

// Status tags (In range / Fair / Low, Live score / Self-rated).
const tagBase = 'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium'
export const tag = {
  ok: `${tagBase} bg-accent-soft text-accent-dark`,
  caution: `${tagBase} bg-caution-soft text-caution`,
  danger: `${tagBase} bg-danger-soft text-danger`,
  neutral: `${tagBase} bg-paper-2 text-muted`,
}

// Buttons. Pair a variant with a size: `${btn.primary} ${btn.lg}`.
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
export const btn = {
  primary: `${btnBase} bg-accent text-white hover:bg-accent-dark`,
  secondary: `${btnBase} border border-line-strong bg-surface text-ink hover:bg-paper-2`,
  dark: `${btnBase} bg-ink text-white hover:bg-ink-2`,
  danger: `${btnBase} bg-danger text-white hover:bg-[#8e2c2a]`,
  dangerOutline: `${btnBase} border border-danger-line bg-surface text-danger hover:bg-danger-soft`,
  ghost: `${btnBase} text-accent hover:bg-accent-soft`,
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-[15px]',
  lg: 'h-11 px-5 text-[15px]',
}

// Form controls (used with @tailwindcss/forms).
const control =
  'block w-full rounded-md border-line-strong bg-surface text-[15px] text-ink placeholder:text-muted focus:border-accent focus:ring-accent'
export const input = `${control} h-11 px-3`
export const select = `${control} h-11 pl-3 pr-9`
export const textarea = `${control} px-3 py-2.5`
export const label = 'block text-sm font-medium text-ink'

// Score tone, shared by tables and badges: 80+ in range, 50-79 fair, below 50 low.
export const scoreTone = (score) => (score >= 80 ? 'ok' : score >= 50 ? 'caution' : 'danger')
export const scoreWord = (score) => (score >= 80 ? 'In range' : score >= 50 ? 'Fair' : 'Low')
