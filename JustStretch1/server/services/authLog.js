import { createHash } from 'node:crypto'

function emailKey(email) {
  if (!email) return null
  return createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex').slice(0, 16)
}

export function authLog(event, details = {}) {
  const entry = { event, at: new Date().toISOString(), ...details }
  if (entry.email) {
    entry.emailHash = emailKey(entry.email)
    delete entry.email
  }
  console.log(`[auth] ${JSON.stringify(entry)}`)
}
