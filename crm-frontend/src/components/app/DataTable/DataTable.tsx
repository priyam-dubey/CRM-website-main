import * as React from 'react'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState, type RowSelectionState, type VisibilityState, type PaginationState } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'
import { COLUMN_VISIBILITY_PREFIX } from '@/config/constants'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export interface BulkAction { label: string; icon?: React.ReactNode; onClick: (ids: string[]) => void; destructive?: boolean }

export interface DataTableProps<TData extends { id: string }> {
  columns: ColumnDef<TData>[]; data: TData[]; totalCount: number; isLoading?: boolean
  pagination: PaginationState; onPaginationChange: (p: PaginationState) => void
  sorting?: SortingState; onSortingChange?: (s: SortingState) => void
  bulkActions?: BulkAction[]
  onRowClick?: (row: TData) => void
  searchPlaceholder?: string; searchValue?: string; onSearchChange?: (v: string) => void
  filters?: React.ReactNode; actions?: React.ReactNode
  tableKey: string; className?: string
}

export function DataTable<TData extends { id: string }>({
  columns, data, totalCount, isLoading, pagination, onPaginationChange,
  sorting = [], onSortingChange, bulkActions, onRowClick,
  searchPlaceholder, searchValue, onSearchChange, filters, actions, tableKey, className,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(COLUMN_VISIBILITY_PREFIX + tableKey, {})

  const table = useReactTable({
    data, columns,
    state: { sorting, pagination, rowSelection, columnVisibility },
    getRowId: (row) => row.id,
    enableRowSelection: !!bulkActions?.length,
    onRowSelectionChange: setRowSelection,
    onSortingChange: updater => onSortingChange?.(typeof updater === 'function' ? updater(sorting) : updater),
    onPaginationChange: updater => onPaginationChange(typeof updater === 'function' ? updater(pagination) : updater),
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, manualSorting: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize), rowCount: totalCount,
  })

  const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <DataTableToolbar table={table} tableKey={tableKey} searchPlaceholder={searchPlaceholder}
        searchValue={searchValue} onSearchChange={onSearchChange} filters={filters} actions={actions}
        selectedIds={selectedIds} bulkActions={bulkActions} onClearSelection={() => setRowSelection({})} />
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b border-slate-200 bg-slate-50">
                  {hg.headers.map(header => (
                    <th key={header.id} className="h-10 px-3 text-left font-medium text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                      {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? [...Array(pagination.pageSize)].map((_,i) => (
                <tr key={i} className="border-b border-slate-200 last:border-0">
                  {columns.map((_,j) => <td key={j} className="px-3 py-3"><Skeleton className="h-4 w-full max-w-[120px]" /></td>)}
                </tr>
              )) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="h-32 text-center text-sm text-slate-400">No results found</td></tr>
              ) : table.getRowModel().rows.map(row => (
                <tr key={row.id}
                  className={cn('border-b border-slate-200 last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-slate-50', row.getIsSelected() && 'bg-blue-50')}
                  onClick={() => onRowClick?.(row.original)}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DataTablePagination table={table} totalCount={totalCount} />
    </div>
  )
}
