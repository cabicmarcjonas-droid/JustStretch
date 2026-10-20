// Shared class strings for the redesign, so every page uses the same container, cards and type.

// 1312px of content at desktop widths, with side padding on smaller screens.
export const container = 'mx-auto w-full max-w-[86rem] px-4 sm:px-8'

// Card surfaces: 16px radius for cards, 24px for large panels.
export const card = 'rounded-2xl border border-slate-300 bg-white shadow-card'
export const panel = 'rounded-3xl border border-slate-300 bg-white shadow-card'

export const pageTitle = 'text-3xl sm:text-4xl font-black italic tracking-tighter text-ink'
export const sectionTitle = 'text-2xl font-black italic tracking-tighter text-ink'
export const eyebrow = 'text-xs font-black uppercase tracking-widest text-accent'
export const statLabel = 'text-xs font-bold uppercase tracking-wider text-slate-500'

// Buttons. Pair a variant with a size: `${btn.primary} ${btn.lg}`.
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
export const btn = {
  primary: `${btnBase} bg-accent text-white hover:bg-accent-dark`,
  secondary: `${btnBase} border border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50`,
  dark: `${btnBase} bg-ink text-white hover:bg-slate-700`,
  danger: `${btnBase} bg-red-700 text-white hover:bg-red-800`,
  dangerOutline: `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`,
  ghost: `${btnBase} text-accent hover:bg-accent-soft`,
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

// Form controls (used with @tailwindcss/forms).
export const input =
  'block w-full h-11 rounded-xl border-slate-300 bg-white px-3.5 text-[15px] text-ink shadow-sm placeholder:text-slate-500 focus:border-accent focus:ring-accent'
export const select =
  'block w-full h-11 rounded-xl border-slate-300 bg-white pl-3.5 pr-9 text-[15px] text-ink shadow-sm focus:border-accent focus:ring-accent'
export const textarea =
  'block w-full rounded-xl border-slate-300 bg-white px-3.5 py-3 text-[15px] text-ink shadow-sm placeholder:text-slate-500 focus:border-accent focus:ring-accent'
export const label = 'block text-sm font-semibold text-slate-700'
