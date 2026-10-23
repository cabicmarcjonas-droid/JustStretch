// Small form pieces ported from the Blade input/button components.
import { forwardRef } from 'react'
import { btn, input, label as labelClass } from '../lib/ui.js'

// Select and textarea classes live in lib/ui.js (`select`, `textarea`).

export function InputLabel({ htmlFor, value, className = '', children }) {
  return (
    <label htmlFor={htmlFor} className={`${labelClass} ${className}`}>
      {value ?? children}
    </label>
  )
}

export const TextInput = forwardRef(function TextInput({ className = '', ...props }, ref) {
  return <input ref={ref} className={`${input} ${className}`} {...props} />
})

// `messages` is the array from the API's `errors[field]`.
export function InputError({ messages, className = '' }) {
  if (!messages || messages.length === 0) return null
  return (
    <ul className={`text-sm text-red-700 space-y-1 ${className}`}>
      {[].concat(messages).map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  )
}

export function PrimaryButton({ className = '', type = 'submit', size = 'md', ...props }) {
  return <button type={type} className={`${btn.primary} ${btn[size]} ${className}`} {...props} />
}

export function SecondaryButton({ className = '', type = 'button', size = 'md', ...props }) {
  return <button type={type} className={`${btn.secondary} ${btn[size]} ${className}`} {...props} />
}

export function DangerButton({ className = '', type = 'submit', size = 'md', ...props }) {
  return <button type={type} className={`${btn.danger} ${btn[size]} ${className}`} {...props} />
}
