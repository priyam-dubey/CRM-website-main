import * as React from 'react'
import { type Table } from '@tanstack/react-table'
import { Search, X, Eye } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { cn } from '@/lib/utils'
import type { BulkAction } from './DataTable'
import { useDebounce } from '@/hooks/useDebounce'

interface Props<TData> {
  table: Table<TData>; tableKey: string; searchPlaceholder?: string; searchValue?: string; onSearchChange?: (v: string) => void
  filters?: React.ReactNode; actions?: React.ReactNode; selectedIds: string[]; bulkActions?: BulkAction[]; onClearSelection: () => void
}

export function DataTableToolbar<TData>({ table, searchPlaceholder = 'Search…', searchValue = '', onSearchChange, filters, actions, selectedIds, bulkActions, onClearSelection }: Props<TData>) {
  const [local, setLocal] = React.useState(searchValue)
  const debounced = useDebounce(local, 300)
  const onSearchChangeRef = React.useRef(onSearchChange)
  React.useEffect(() => { onSearchChangeRef.current = onSearchChange })
  React.useEffect(() => { onSearchChangeRef.current?.(debounced) }, [debounced])

  if (selectedIds.length > 0 && bulkActions?.length) return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-md px-4 py-2.5">
      <span className="text-sm font-medium text-blue-700">{selectedIds.length} selected</span>
      <div className="flex gap-2">
        {bulkActions.map((a, i) => (
          <Button key={i} size="sm" variant={a.destructive ? 'destructive' : 'outline'} onClick={() => a.onClick(selectedIds)} leftIcon={a.icon ? <>{a.icon}</> : undefined}>{a.label}</Button>
        ))}
      </div>
      <Button size="sm" variant="ghost" onClick={onClearSelection} className="ml-auto" leftIcon={<X className="h-3.5 w-3.5" />}>Clear</Button>
    </div>
  )

  return (
    <div className="flex items-center gap-2">
      {onSearchChange && (
        <div className="relative flex-1 max-w-xs">
          <Input placeholder={searchPlaceholder} value={local} onChange={e => setLocal(e.target.value)}
            leftAddon={<Search className="h-4 w-4" />}
            rightAddon={local ? <button className="pointer-events-auto" onClick={() => { setLocal(''); onSearchChange('') }}><X className="h-3.5 w-3.5" /></button> : undefined} />
        </div>
      )}
      {filters && <div className="flex gap-2">{filters}</div>}
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>Columns</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table.getAllColumns().filter(c => c.getCanHide()).map(col => (
            <DropdownMenuPrimitive.CheckboxItem key={col.id}
              className={cn('relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pl-8 text-sm text-slate-700 outline-none focus:bg-slate-100')}
              checked={col.getIsVisible()} onCheckedChange={v => col.toggleVisibility(!!v)}>
              <span className="absolute left-2">{col.getIsVisible() ? '✓' : ''}</span>
              <span className="capitalize">{col.id.replace(/_/g,' ')}</span>
            </DropdownMenuPrimitive.CheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
