import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api } from './api.js'

// "{Page} · Just Stretch", like the Blade layouts. No title means just the app name.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Just Stretch` : 'Just Stretch'
  }, [title])
}

// GET helper for pages: { data, error, loading, refreshing, reload }. Re-fetches when `path` changes.
// With `keepPrevious`, a filter change keeps the last response on screen while the
// next one loads (`refreshing` is true meanwhile) instead of unmounting the page,
// so the layout and scroll position stay put.
export function useFetch(path, { keepPrevious = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true, path })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .get(path)
      .then((data) => !cancelled && setState({ data, error: null, loading: false, path }))
      .catch((error) => {
        if (cancelled) return
        setState({ data: null, error: error instanceof ApiError ? error : new ApiError(0, { message: error.message }), loading: false, path })
      })
    return () => {
      cancelled = true
    }
  }, [path, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  // While a new path is loading, report loading instead of the previous page's data,
  // unless the caller asked to keep it (filters on the same page).
  const stale = state.path !== path
  if (keepPrevious && stale && state.data) {
    return { data: state.data, error: null, loading: false, refreshing: true, reload }
  }
  return { data: stale ? null : state.data, error: stale ? null : state.error, loading: stale || state.loading, refreshing: false, reload }
}

// Tweens a whole number from its previous value to `value` over `duration` ms with an
// exponential ease-out. The first value shows as is; later changes count. Skipped
// under reduced motion. One requestAnimationFrame loop, cancelled on change.
export function useCountUp(value, duration = 600) {
  const [shown, setShown] = useState(value)
  // What is on screen right now, so an interrupted count carries on from there.
  const current = useRef(value)

  useEffect(() => {
    const start = current.current
    const show = (next) => {
      current.current = next
      setShown(next)
    }
    if (typeof value !== 'number' || typeof start !== 'number' || start === value || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      show(value)
      return undefined
    }
    let frame
    const t0 = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration)
      show(Math.round(start + (value - start) * (t === 1 ? 1 : 1 - 2 ** (-10 * t))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return shown
}

// Form state with Laravel-style field errors (`errors.email` is an array of messages).
// submit(action) runs `action(values)`; a 422 fills `errors`, any other API failure fills
// `errors._form` so the page can show a generic message.
export function useForm(initial) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const setField = useCallback((name, value) => setValues((current) => ({ ...current, [name]: value })), [])

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (event) => setField(name, event.target.value),
  })

  const bindCheckbox = (name) => ({
    name,
    checked: Boolean(values[name]),
    onChange: (event) => setField(name, event.target.checked),
  })

  const submit = useCallback(
    async (action) => {
      setProcessing(true)
      setErrors({})
      try {
        return await action(values)
      } catch (error) {
        if (error instanceof ApiError) {
          setErrors(error.status === 422 ? error.errors : { _form: [error.message] })
          return undefined
        }
        setErrors({ _form: ['Could not reach the server. Check your connection and try again.'] })
        return undefined
      } finally {
        setProcessing(false)
      }
    },
    [values],
  )

  return { values, setValues, setField, bind, bindCheckbox, errors, setErrors, processing, submit }
}
