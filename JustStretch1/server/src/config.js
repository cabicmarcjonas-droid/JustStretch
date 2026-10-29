const PLACEHOLDER_SECRETS = new Set(['dev-only-secret', 'change-me-in-production', 'replace-with-a-32-character-random-secret'])

function parseTrustProxy(value) {
  if (value === undefined || value === '') return 1
  if (value === 'false') return false
  if (/^\d+$/.test(value)) return Number(value)
  return value
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback
  return !['false', '0', 'no'].includes(String(value).toLowerCase())
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

export function loadConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production'
  const sessionSecret = env.SESSION_SECRET?.trim() || 'dev-only-secret'
  const appUrl = env.APP_URL?.trim() || 'http://localhost:5173'
  const mailTransport = (env.MAIL_TRANSPORT?.trim() || (isProduction ? 'smtp' : 'console')).toLowerCase()
  const smtpPort = Number(env.SMTP_PORT) || 465
  const smtpSecure = parseBoolean(env.SMTP_SECURE, smtpPort === 465)
  const smtpUser = env.SMTP_USER?.trim() || ''
  const smtpPass = env.SMTP_PASS?.trim() || ''
  const mailFrom = env.MAIL_FROM?.trim() || (smtpUser ? `Just Stretch <${smtpUser}>` : 'Just Stretch <no-reply@juststretch.local>')

  let appOrigin
  try {
    appOrigin = new URL(appUrl).origin
  } catch {
    throw new Error('APP_URL must be a valid absolute URL.')
  }

  if (isProduction) {
    requireValue(sessionSecret.length >= 32 && !PLACEHOLDER_SECRETS.has(sessionSecret), 'SESSION_SECRET must be a random 32+ character value in production.')
    requireValue(appUrl.startsWith('https://'), 'APP_URL must use HTTPS in production.')
    requireValue(mailTransport === 'smtp', 'MAIL_TRANSPORT must be smtp in production.')
    requireValue(smtpUser && smtpPass, 'SMTP_USER and SMTP_PASS are required in production.')
    requireValue(mailFrom, 'MAIL_FROM is required in production.')
  } else if (sessionSecret === 'dev-only-secret' || PLACEHOLDER_SECRETS.has(sessionSecret)) {
    console.warn('[config] WARNING: using a placeholder SESSION_SECRET. Set a random 32+ character value before production.')
  }

  if (mailTransport === 'smtp' && (!smtpUser || !smtpPass)) {
    throw new Error('SMTP_USER and SMTP_PASS are required when MAIL_TRANSPORT=smtp.')
  }

  if (!['smtp', 'console', 'memory'].includes(mailTransport)) {
    throw new Error('MAIL_TRANSPORT must be smtp, console or memory.')
  }

  return {
    isProduction,
    sessionSecret,
    appUrl,
    appOrigin,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    mail: {
      transport: mailTransport,
      host: env.SMTP_HOST?.trim() || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
      from: mailFrom,
    },
  }
}
