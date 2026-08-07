import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps { icon?: LucideIcon; title: string; description?: string; action?: { label: string; onClick: () => void }; className?: string }

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && <div className="mb-4 p-4 rounded-full bg-slate-100"><Icon className="h-8 w-8 text-slate-400" /></div>}
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <Button className="mt-4" onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
