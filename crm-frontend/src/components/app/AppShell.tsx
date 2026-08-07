import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useIsTablet } from '@/hooks/useMediaQuery'
import { SIDEBAR_STORAGE_KEY } from '@/config/constants'
import { QuickNotesWidget } from '@/features/quick-notes/components/QuickNotesWidget'

export function AppShell({ children }: { children: ReactNode }) {
  const isTablet = useIsTablet()
  const [collapsed, setCollapsed] = useLocalStorage(SIDEBAR_STORAGE_KEY, false)
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar collapsed={isTablet ? true : collapsed} onToggle={() => setCollapsed(v => !v)} isMobile={isTablet} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
          </main>
        </div>
      </div>
      {/* Mounted once here so it appears on every authenticated page (AppShell
          wraps every route inside AuthGuard) without being duplicated per-page. */}
      <QuickNotesWidget />
    </TooltipProvider>
  )
}
