import { useState, useEffect } from "react"
import { Search }              from "lucide-react"
import { useAuth }             from "@/features/auth/hooks/useAuth"
import { Avatar }              from "@/components/ui/Avatar"
import { Button }              from "@/components/ui/Button"
import { NotificationCenter }  from "@/components/app/NotificationCenter"
import { GlobalSearchModal }   from "@/components/app/GlobalSearchModal"
import { useBreadcrumbs }      from "@/hooks/useBreadcrumbs"
import { Link }                from "react-router-dom"

export function Topbar() {
  const { user }      = useAuth()
  const breadcrumbs   = useBreadcrumbs()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 gap-4 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">/</span>}
            {i === breadcrumbs.length - 1
              ? <span className="font-medium text-slate-900 truncate">{crumb.label}</span>
              : <Link to={crumb.href} className="text-slate-500 hover:text-slate-900 transition-colors truncate">{crumb.label}</Link>
            }
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" aria-label="Search (Cmd+K)" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>
        <NotificationCenter />
        {user && <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />}
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
