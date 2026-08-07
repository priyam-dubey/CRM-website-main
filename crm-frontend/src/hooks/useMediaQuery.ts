import { useState, useEffect } from 'react'
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const l = (e: MediaQueryListEvent) => setMatches(e.matches)
    m.addEventListener('change', l); return () => m.removeEventListener('change', l)
  }, [query])
  return matches
}
export const useIsTablet = () => useMediaQuery('(max-width: 1279px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1280px)')
