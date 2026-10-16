// Small form pieces ported from the Blade input/button components.
import { forwardRef } from 'react'

export function InputLabel({ htmlFor, value, className = '', children }) {
  return (
    <label htmlFor={htmlFor} className={`block font-medium text-sm text-ink ${className}`}>
      {value ?? children}
    </label>
  )
}

export const TextInput = forwardRef(function TextInput({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`border-line bg-white text-ink placeholder:text-muted/70 focus:border-accent focus:ring-accent rounded-lg shadow-sm ${className}`}
      {...props}
    />
  )
})

export const SELECT_CLASSES = 'rounded-lg border-line bg-white text-ink shadow-sm focus:border-accent focus:ring-accent'
export const TEXTAREA_CLASSES =
  'block w-full rounded-lg border-line bg-white text-ink shadow-sm placeholder:text-muted/70 focus:border-accent focus:ring-accent'

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

export function PrimaryButton({ className = '', type = 'submit', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent border border-transparent rounded-full font-medium text-sm text-white hover:bg-accent-dark focus:bg-accent-dark active:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-50 transition ease-in-out duration-150 ${className}`}
      {...props}
    />
  )
}

export function SecondaryButton({ className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-line rounded-full font-medium text-sm text-ink hover:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-25 transition ease-in-out duration-150 ${className}`}
      {...props}
    />
  )
}

export function DangerButton({ className = '', type = 'submit', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 border border-transparent rounded-full font-medium text-sm text-white hover:bg-red-600 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
