import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus }          from "lucide-react"
import { PageHeader }    from "@/components/app/PageHeader"
import { Button }        from "@/components/ui/Button"
import { Badge }         from "@/components/ui/Badge"
import { Avatar }        from "@/components/ui/Avatar"
import { ErrorState }    from "@/components/app/ErrorState"
import { DataTable }     from "@/components/app/DataTable/DataTable"
import { DataTableColumnHeader } from "@/components/app/DataTable/DataTableColumnHeader"
import { useUsers, useDeleteUser } from "../hooks/useUsers"
import { usePermission } from "@/hooks/usePermission"
import { ROLE_LABELS }   from "@/config/constants"
import { formatRelativeTime } from "@/lib/utils"
import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import type { User } from "@/types/user.types"

const columns: ColumnDef<User>[] = [
  { id: "name", size: 220,
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    accessorFn: r => r.firstName + " " + r.lastName,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.firstName + " " + row.original.lastName} size="sm" />
        <div>
          <p className="font-medium text-slate-900 text-sm">{row.original.firstName} {row.original.lastName}</p>
          <p className="text-xs text-slate-400">{row.original.email}</p>
        </div>
      </div>
    ) },
  { id: "role", accessorKey: "role", size: 110,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => (
      <Badge variant={row.original.role === "ADMIN" ? "primary" : row.original.role === "MANAGER" ? "info" : "default"}>
        {ROLE_LABELS[row.original.role] ?? row.original.role}
      </Badge>
    ) },
  { id: "status", accessorKey: "isActive", size: 100,
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "success" : "default"} dot>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ) },
  { id: "lastLogin", accessorKey: "lastLoginAt", size: 150,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
    cell: ({ row }) => (
      <span className="text-xs text-slate-400">
        {row.original.lastLoginAt ? formatRelativeTime(row.original.lastLoginAt) : "Never"}
      </span>
    ) },
]

export default function UsersListPage() {
  const navigate    = useNavigate()
  const canCreate   = usePermission("users", "create")
  const canDelete   = usePermission("users", "delete")
  const [search, setSearch]       = useState("")
  const [sorting, setSorting]     = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const { data, isLoading, isError, refetch } = useUsers({
    page:     pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    ...(search ? { search } : {}),
  })

  const deleteUser = useDeleteUser()

  if (isError) return <ErrorState title="Failed to load users" onRetry={refetch} />

  return (
    <div className="space-y-4">
      <PageHeader title="Users"
        subtitle={data ? `${data.meta.total_count} users` : "Loading…"}
        actions={
          canCreate && (
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/users/new")}>New User</Button>
          )
        } />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalCount={data?.meta.total_count ?? 0}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        searchPlaceholder="Search by name or email…"
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPagination(p => ({ ...p, pageIndex: 0 })) }}
        onRowClick={row => navigate(`/users/${row.id}`)}
        tableKey="users"
        bulkActions={canDelete ? [
          { label: "Delete selected", destructive: true,
            onClick: ids => ids.forEach(id => deleteUser.mutate(id)) },
        ] : []}
      />
    </div>
  )
}
