// Tiny client-side event bus on top of EventTarget. Replaces the `window`
// CustomEvents the Laravel version used (e.g. `session-ended`).
const bus = new EventTarget()

export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }))
}

// Returns an unsubscribe function, so it can be used directly as an effect cleanup.
export function on(type, handler) {
  const listener = (event) => handler(event.detail)
  bus.addEventListener(type, listener)
  return () => bus.removeEventListener(type, listener)
}
