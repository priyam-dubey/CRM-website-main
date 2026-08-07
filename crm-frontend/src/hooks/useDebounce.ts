import { useState, useEffect } from 'react'
export function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value)
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t) }, [value, delay])
  return dv
}
