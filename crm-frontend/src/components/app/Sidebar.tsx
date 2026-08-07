import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useState } from 'react'
import { NAV_GROUPS, BOTTOM_NAV_ITEMS, type NavItem } from '@/config/navigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Tooltip } from '@/components/ui/Tooltip'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/config/constants'

function NavItemRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation()
  const [open, setOpen] = useState(() =>
    item.children?.some(c => location.pathname.startsWith(c.href)) ?? false
  )
  const isActive = item.children
    ? item.children.some(c => location.pathname.startsWith(c.href))
    : location.pathname.startsWith(item.href)
  const Icon = item.icon

  if (item.children && !collapsed) {
    return (
      <div>
        <button onClick={() => setOpen(v => !v)}
          className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">{item.label}</span>
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        </button>
        {open && (
          <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-0.5">
            {item.children.map(child => (
              <NavLink key={child.href} to={child.href} end={child.href === item.href}
                className={({ isActive }) => cn("flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                  isActive ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
                <child.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  const dest = item.children ? item.children[0].href : item.href
  const link = (
    <NavLink to={dest}
      className={() => cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white",
        collapsed && "justify-center px-2")}>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
  return collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link
}

export function Sidebar({ collapsed, onToggle, isMobile }: { collapsed: boolean; onToggle: () => void; isMobile: boolean }) {
  const { user, logout } = useAuth()
  return (
    <aside className={cn("flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-200 shrink-0",
      collapsed ? "w-[72px]" : "w-[260px]")}>
      <div className={cn("flex items-center h-16 px-4 border-b border-slate-800 shrink-0", collapsed && "justify-center px-2")}>
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary shrink-0">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        {!collapsed && <span className="ml-3 font-semibold text-white truncate">{APP_NAME}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => <NavItemRow key={item.href} item={item} collapsed={collapsed} />)}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-2 space-y-1">
        {BOTTOM_NAV_ITEMS.map(item => <NavItemRow key={item.href} item={item} collapsed={collapsed} />)}
        {user && (
          <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center px-2")}>
            <Avatar name={user.firstName + " " + user.lastName} size="sm" />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
                </div>
                <button onClick={logout} className="text-slate-400 hover:text-white transition-colors" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
        {!isMobile && (
          <button onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
        )}
      </div>
    </aside>
  )
}
