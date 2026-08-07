import { type Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatNumber } from '@/lib/utils'

export function DataTablePagination<TData>({ table, totalCount }: { table: Table<TData>; totalCount: number }) {
  const { pageIndex, pageSize } = table.getState().pagination
  const from = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalCount)
  return (
    <div className="flex items-center justify-between gap-4 px-1">
      <p className="text-sm text-slate-500">{totalCount === 0 ? 'No results' : `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(totalCount)}`}</p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 whitespace-nowrap">Per page</span>
          <Select value={String(pageSize)} onValueChange={v => { table.setPageSize(Number(v)); table.setPageIndex(0) }}>
            <SelectTrigger className="w-16 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{[10,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-slate-500 px-2 whitespace-nowrap">Page {pageIndex + 1} of {table.getPageCount() || 1}</span>
          <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon-sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}
