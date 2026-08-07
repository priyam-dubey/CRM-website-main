import { useState, useEffect, useCallback, type ReactNode } from "react"
import { AuthContext }   from "./hooks/useAuth"
import { tokenStore }    from "@/lib/api-client"
import { apiClient }     from "@/lib/api-client"
import { queryClient }   from "@/lib/query-client"
import type { AuthUser } from "@/types/auth.types"

const STORAGE_KEY = "crm_demo_authed"
const USE_MOCK    = import.meta.env.VITE_USE_MOCK === "true" || !import.meta.env.VITE_API_BASE_URL

// Mock user for local demo (no backend required)
const MOCK_USER: AuthUser = {
  id: "user-1", companyId: "company-1", email: "admin@demo.com",
  firstName: "Alex", lastName: "Morgan", role: "ADMIN",
  permissions: {
    dashboard: { view: true, export: true },
    bookings:  { view: true, create: true, edit: true, delete: true, export: true },
    users:     { view: true, create: true, edit: true, delete: true, manage: true },
    revenue:   { view: true, create: true, edit: true, delete: true, export: true, manage: true },
    security:  { view: true, manage: true },
    activity:  { view: true, export: true },
    manage:    { view: true, create: true, edit: true, delete: true },
    settings:  { view: true, manage: true },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Try to restore session on mount
  useEffect(() => {
    const restore = async () => {
      if (USE_MOCK) {
        // Demo mode: check sessionStorage flag
        if (sessionStorage.getItem(STORAGE_KEY)) {
          setUser(MOCK_USER)
          tokenStore.set("mock-token")
        }
        setIsLoading(false)
        return
      }

      // Real backend: attempt silent token refresh
      try {
        const res = await apiClient.post<{ data: { accessToken: string } }>("/auth/refresh", {}, { withCredentials: true })
        tokenStore.set(res.data.data.accessToken)
        const meRes = await apiClient.get<{ data: AuthUser }>("/users/me")
        setUser(meRes.data.data)
      } catch {
        // No valid session — user needs to log in
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (USE_MOCK) {
      if (email === "admin@demo.com" && password === "password") {
        sessionStorage.setItem(STORAGE_KEY, "1")
        tokenStore.set("mock-token")
        setUser(MOCK_USER)
      } else {
        throw new Error("Invalid credentials")
      }
      return
    }

    // Real backend login
    const res = await apiClient.post<{ data: { accessToken: string; user: AuthUser } }>("/auth/login", { email, password })
    tokenStore.set(res.data.data.accessToken)
    setUser(res.data.data.user)
  }, [])

  const logout = useCallback(async () => {
    if (USE_MOCK) {
      sessionStorage.removeItem(STORAGE_KEY)
      tokenStore.clear()
      setUser(null)
      return
    }
    try { await apiClient.post("/auth/logout") } catch {}
    tokenStore.clear()
    queryClient.clear()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (USE_MOCK) return  // mock user is static
    const meRes = await apiClient.get<{ data: AuthUser }>("/users/me")
    setUser(meRes.data.data)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
