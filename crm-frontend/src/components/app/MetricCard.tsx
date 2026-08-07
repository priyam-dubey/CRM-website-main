import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string; value: string; delta?: number; deltaLabel?: string;
  icon?: LucideIcon; iconColor?: string; isLoading?: boolean; className?: string
}

export function MetricCard({ label, value, delta, deltaLabel, icon: Icon, iconColor = 'text-blue-600', isLoading, className }: MetricCardProps) {
  const isPos = delta !== undefined && delta > 0
  const isNeg = delta !== undefined && delta < 0
  return (
    <div className={cn('rounded-md border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          {isLoading ? <><Skeleton className="h-8 w-28 mb-2" /><Skeleton className="h-3 w-20" /></>
          : <>
            <p className="text-3xl font-bold text-slate-900 leading-none mb-2 truncate">{value}</p>
            {delta !== undefined && (
              <div className="flex items-center gap-1">
                {isPos && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
                {isNeg && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                {!isPos && !isNeg && <Minus className="h-3.5 w-3.5 text-slate-400" />}
                <span className={cn('text-xs font-medium', isPos ? 'text-green-600' : isNeg ? 'text-red-600' : 'text-slate-400')}>
                  {isPos && '+'}{delta.toFixed(1)}%{deltaLabel && <span className="font-normal text-slate-400 ml-1">{deltaLabel}</span>}
                </span>
              </div>
            )}
          </>}
        </div>
        {Icon && <div className={cn('shrink-0 ml-4 p-2.5 rounded-md bg-slate-50', iconColor)}><Icon className="h-5 w-5" /></div>}
      </div>
    </div>
  )
}
