import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from './api.js'

// "{Page} · Just Stretch", like the Blade layouts. No title means just the app name.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Just Stretch` : 'Just Stretch'
  }, [title])
}

// GET helper for pages: { data, error, loading, reload }. Re-fetches when `path` changes.
export function useFetch(path) {
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

  // While a new path is loading, report loading instead of the previous page's data.
  const stale = state.path !== path
  return { data: stale ? null : state.data, error: stale ? null : state.error, loading: stale || state.loading, reload }
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

  return { values, setValues, setField, bind, errors, setErrors, processing, submit }
}
