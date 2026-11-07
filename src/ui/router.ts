import { useEffect, useState } from 'react'
import type { Stage } from '../domain/types'

export type CaseScreen = Stage | 'casefile' | 'notebook'

export type Route =
  | { kind: 'home' }
  | { kind: 'settings' }
  | { kind: 'case'; caseId: string; screen: string; anchor: string | null }
  | { kind: 'notfound' }

const CASE_SCREENS = new Set<string>([
  'brief',
  'casefile',
  'investigation',
  'evidence',
  'hypotheses',
  'analysis',
  'proof',
  'submission',
  'feedback',
  'notebook',
])

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').trim()
  if (clean === '') return { kind: 'home' }
  const [pathPart, anchorPart] = clean.split('#')
  const parts = pathPart.split('/').filter(Boolean)
  if (parts[0] === 'settings') return { kind: 'settings' }
  if (parts[0] === 'case' && parts[1]) {
    const screen = parts[2] ?? 'brief'
    if (!CASE_SCREENS.has(screen)) return { kind: 'notfound' }
    return { kind: 'case', caseId: parts[1], screen, anchor: anchorPart || null }
  }
  return { kind: 'notfound' }
}

export function navigate(path: string): void {
  const next = `#/${path.replace(/^#\/?/, '')}`
  if (window.location.hash === next) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.location.hash = next
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    if (route.kind !== 'case' || !route.anchor) return
    const frame = window.requestAnimationFrame(() => {
      const target =
        document.getElementById(route.anchor ?? '') ??
        document.getElementById(`evidence-${route.anchor ?? ''}`)
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [route])

  return route
}

export function isCaseScreen(screen: string): screen is CaseScreen {
  return CASE_SCREENS.has(screen)
}
