import nodemailer from 'nodemailer'

const FAKE_DOMAINS = new Set(['example.com', 'example.net', 'example.org', 'example', 'localhost'])
const FAKE_SUFFIXES = ['.test', '.example', '.invalid', '.localhost']

export function isFakeEmail(email) {
  const domain = String(email).split('@')[1]?.toLowerCase() ?? ''
  return FAKE_DOMAINS.has(domain) || FAKE_SUFFIXES.some((suffix) => domain.endsWith(suffix))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function verificationMessage({ name, code, expiresMinutes }) {
  const safeName = name ? escapeHtml(name) : ''
  const greeting = safeName ? `Hi ${safeName},` : 'Hi,'
  return {
    subject: 'Your Just Stretch verification code',
    text: `${greeting}\n\nYour verification code is ${code}. It expires in ${expiresMinutes} minutes.\n\nIf you did not create a Just Stretch account, you can ignore this email.`,
    html: `<p>${greeting}</p><p>Your verification code is:</p><p style="font-size:28px;font-weight:600;letter-spacing:6px;font-family:monospace">${code}</p><p>It expires in ${expiresMinutes} minutes.</p><p>If you did not create a Just Stretch account, you can ignore this email.</p>`,
  }
}

function resetMessage({ name, resetUrl, expiresMinutes }) {
  const safeName = name ? escapeHtml(name) : ''
  const greeting = safeName ? `Hi ${safeName},` : 'Hi,'
  return {
    subject: 'Reset your Just Stretch password',
    resetUrl,
    text: `${greeting}\n\nReset your password with this link. It expires in ${expiresMinutes} minutes and can only be used once:\n\n${resetUrl}\n\nIf you did not ask for a reset, you can ignore this email.`,
    html: `<p>${greeting}</p><p>Reset your password with the link below. It expires in ${expiresMinutes} minutes and can only be used once.</p><p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p><p>If you did not ask for a reset, you can ignore this email.</p>`,
  }
}

export function createMemoryMailer() {
  const messages = []

  const record = (message) => {
    messages.push({ ...message, createdAt: new Date() })
    return { delivered: false, preview: true }
  }

  return {
    transport: 'memory',
    messages,
    async sendVerificationCode(message) {
      return record({ type: 'verification', to: message.to, code: message.code })
    },
    async sendPasswordReset(message) {
      return record({ type: 'reset', to: message.to, resetUrl: message.resetUrl })
    },
    lastCode(to) {
      const message = [...messages].reverse().find((item) => item.type === 'verification' && item.to === String(to).toLowerCase())
      return message?.code ?? null
    },
    lastResetUrl(to) {
      const message = [...messages].reverse().find((item) => item.type === 'reset' && item.to === String(to).toLowerCase())
      return message?.resetUrl ?? null
    },
    clear() {
      messages.length = 0
    },
    async close() {},
  }
}

export function createMailer(config, { logger = console } = {}) {
  const { mail, isProduction } = config
  let transporter = null

  const getTransporter = () => {
    transporter ??= nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.pass },
    })
    return transporter
  }

  const send = async (to, template, code) => {
    const viaConsole = mail.transport === 'console' || (!isProduction && mail.transport === 'smtp' && isFakeEmail(to))

    if (viaConsole) {
      if (isProduction) throw new Error('Console mail transport is not available in production.')
      logger.log(`[mail] ${template.subject} -> ${to}`)
      if (code) logger.log(`[mail] Verification code for ${to}: ${code}`)
      if (template.resetUrl) logger.log(`[mail] Password reset link for ${to}: ${template.resetUrl}`)
      return { delivered: false, preview: true }
    }

    await getTransporter().sendMail({ from: mail.from, to, subject: template.subject, text: template.text, html: template.html })
    return { delivered: true, preview: false }
  }

  return {
    transport: mail.transport,
    async sendVerificationCode({ to, name, code, expiresMinutes = 10 }) {
      return send(to, verificationMessage({ name, code, expiresMinutes }), code)
    },
    async sendPasswordReset({ to, name, resetUrl, expiresMinutes = 60 }) {
      return send(to, resetMessage({ name, resetUrl, expiresMinutes }))
    },
    async close() {
      transporter?.close()
    },
  }
}
