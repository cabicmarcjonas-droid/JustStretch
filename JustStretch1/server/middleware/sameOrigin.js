const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function sameOrigin(config) {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next()

    const fetchSite = req.get('sec-fetch-site')
    if (fetchSite === 'cross-site') {
      return res.status(403).json({ message: 'This action is unauthorized.' })
    }

    const origin = req.get('origin')
    if (origin && origin !== config.appOrigin) {
      return res.status(403).json({ message: 'This action is unauthorized.' })
    }

    next()
  }
}
