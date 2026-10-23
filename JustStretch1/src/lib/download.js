// Saves text as a file in the browser (performance logs for the paper).
export function downloadText(filename, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// "neck-side-tilt-2026-10-22T03-15-08"
export function logFileStem(title) {
  const slug = String(title ?? 'session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  return `${slug || 'session'}-${stamp}`
}
