import { useState, useCallback } from 'react'
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T | ((p: T) => T)) => void, () => void] {
  const [sv, setSv] = useState<T>(() => {
    try { const i = window.localStorage.getItem(key); return i ? JSON.parse(i) as T : initialValue } catch { return initialValue }
  })
  const setValue = useCallback((value: T | ((p: T) => T)) => {
    const v = value instanceof Function ? value(sv) : value
    setSv(v); try { window.localStorage.setItem(key, JSON.stringify(v)) } catch {}
  }, [key, sv])
  const removeValue = useCallback(() => { try { window.localStorage.removeItem(key) } catch {}; setSv(initialValue) }, [key, initialValue])
  return [sv, setValue, removeValue]
}
