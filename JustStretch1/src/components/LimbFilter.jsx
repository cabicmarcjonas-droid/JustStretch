import { LIMBS } from '../lib/limbs.js'

// Chip style shared with the fatigue buttons: accent fill when active, 1px rule
// otherwise. Buttons (not checkboxes) so keyboard and screen-reader users get the
// same toggle behaviour, exposed with aria-pressed.
// Pressing scales the chip down slightly so the click registers before the data returns.
const chip = (active) =>
  `h-9 rounded-md border px-3 text-sm font-semibold transition-[color,background-color,border-color,scale] duration-200 ease-out-expo active:scale-[0.96] ${
    active ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-paper-2'
  }`

// Limb selector above the dashboard's form score summary. Multi-select: "All limbs"
// is the default (empty selection) and keeps the original, unfiltered behaviour.
// `busy` marks the group while the re-scored data is on its way.
export default function LimbFilter({ selected, onChange, busy = false }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((limb) => limb !== id) : [...selected, id])

  return (
    <div role="group" aria-label="Filter the form score by limb" aria-busy={busy} className="flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={selected.length === 0} onClick={() => onChange([])} className={chip(selected.length === 0)}>
        All limbs
      </button>
      {LIMBS.map((limb) => (
        <button
          key={limb.id}
          type="button"
          aria-pressed={selected.includes(limb.id)}
          onClick={() => toggle(limb.id)}
          className={chip(selected.includes(limb.id))}
        >
          {limb.label}
        </button>
      ))}
    </div>
  )
}
