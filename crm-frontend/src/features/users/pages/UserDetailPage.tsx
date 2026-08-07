import { useState } from "react"
import type { QuickNote } from '@/types/quick-note.types'
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, Shield, Calendar, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Skeleton } from "@/components/ui/Skeleton"
import { ErrorState } from "@/components/app/ErrorState"
import { ConfirmDialog } from "@/components/ui/Modal"
import { useUser, useUpdateUser, useDeleteUser } from "../hooks/useUsers"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { usePermission } from "@/hooks/usePermission"
import { ROLE_LABELS } from "@/config/constants"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerTitle, DrawerDescription } from '@/components/ui/Drawer'
import { useQuery } from '@tanstack/react-query'
import { quickNoteService } from '@/services/quick-note.service'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const { data: user, isLoading, isError, refetch } = useUser(id ?? "")
  const updateUser = useUpdateUser(id ?? "")
  const deleteUser = useDeleteUser()
  const canEdit = usePermission("users", "edit")
  const canDelete = usePermission("users", "delete")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  
  const { data: userNotes = [], isLoading: notesLoading } = useQuery<QuickNote[]>({
    queryKey: ['userNotes', id],
    queryFn: () => quickNoteService.list(1, 100, id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>
  }
  if (isError || !user) {
    return <ErrorState title="Failed to load user" onRetry={refetch} />
  }

  const isSelf = currentUser?.id === user.id

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate("/users")}>
        Back to Users
      </Button>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        actions={
          <>
            {canDelete && !isSelf && (
              <Button variant="outline" size="sm" leftIcon={<Trash2 className="h-4 w-4 text-red-500" />}
                onClick={() => setConfirmDelete(true)}>
                Delete User
              </Button>
            )}
            {currentUser?.role === 'ADMIN' && !isSelf && (
              <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
                View Notes
              </Button>
            )}
          </>
        }
      />

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{user.firstName} {user.lastName}</h2>
              <Badge variant={user.isActive ? "success" : "default"} dot>{user.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="text-sm text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Email</dt>
              <dd className="text-sm text-slate-900">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Role</dt>
              <dd className="text-sm text-slate-900">{ROLE_LABELS[user.role]}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Last Login</dt>
              <dd className="text-sm text-slate-900">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Member Since</dt>
              <dd className="text-sm text-slate-900">{formatDateTime(user.createdAt)}</dd>
            </div>
          </div>
        </dl>

        {(canEdit || isSelf) && (
          <div className="mt-6 pt-6 border-t border-slate-200 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUser.mutate({ isActive: !user.isActive })}
              loading={updateUser.isPending}
              disabled={!canEdit || isSelf}
            >
              {user.isActive ? "Deactivate" : "Activate"} User
            </Button>
            {!canEdit && isSelf && (
              <p className="text-xs text-slate-400">Only an admin can change account status.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { deleteUser.mutate(user.id); setConfirmDelete(false); navigate("/users") }}
        title="Delete User"
        description={`This will permanently remove ${user.firstName} ${user.lastName}'s access. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteUser.isPending}
      />

      <Drawer open={notesOpen} onOpenChange={setNotesOpen}>
        <DrawerContent className="w-full sm:w-[420px]">
          <DrawerHeader>
            <DrawerTitle>User Notes</DrawerTitle>
            <DrawerDescription>Quick notes for this user.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {notesLoading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : userNotes && userNotes.length > 0 ? (
              userNotes.map((note: any) => (
                <div key={note.id} className="border-b pb-2 mb-2">
                  <p className="text-sm text-slate-900">{note.note}</p>
                  <p className="text-xs text-slate-400">{formatRelativeTime(note.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No notes found.</p>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
