import { type Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: { column: Column<TData, TValue>; title: string; className?: string }) {
  if (!column.getCanSort()) return <span className={cn('text-xs font-medium uppercase tracking-wide', className)}>{title}</span>
  const sorted = column.getIsSorted()
  return (
    <button className={cn('flex items-center gap-1.5 group text-xs font-medium uppercase tracking-wide hover:text-slate-900 transition-colors', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}>
      {title}
      {sorted === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
       : sorted === 'desc' ? <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
       : <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  )
}
