import { useState, useRef } from "react"
import { Send, Pencil, Trash2, Check, X } from "lucide-react"
import { Avatar }    from "@/components/ui/Avatar"
import { Button }    from "@/components/ui/Button"
import { Skeleton }  from "@/components/ui/Skeleton"
import { ConfirmDialog } from "@/components/ui/Modal"
import { cn, formatRelativeTime, formatDateTime } from "@/lib/utils"
import { useBookingNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/features/bookings/hooks/useBookingNotes"
import { useAuth }   from "@/features/auth/hooks/useAuth"
import type { BookingNote } from "@/types/note.types"

// ─── Single note card ─────────────────────────────────────────────────────
function NoteCard({
  note,
  currentUserId,
  canEdit,
  canDelete,
  bookingId,
}: {
  note:          BookingNote
  currentUserId: string
  canEdit:       boolean
  canDelete:     boolean
  bookingId:     string
}) {
  const [editing, setEditing]   = useState(false)
  const [editText, setEditText] = useState(note.note)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const updateNote = useUpdateNote(bookingId)
  const deleteNote = useDeleteNote(bookingId)

  const isOwner  = note.userId === currentUserId || note.user?.id === currentUserId
  const authorName = note.user
    ? `${note.user.firstName} ${note.user.lastName}`.trim() || "User"
    : "User"

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === note.note) { setEditing(false); return }
    await updateNote.mutateAsync({ id: note.id, note: editText.trim() })
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(note.note)
    setEditing(false)
  }

  const isTemp = note.id.startsWith("temp-")

  return (
    <div className={cn("group flex gap-3", isTemp && "opacity-60")}>
      {/* Avatar */}
      <Avatar name={authorName} size="sm" className="shrink-0 mt-0.5" />

      {/* Content bubble */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-slate-900">{authorName}</span>
          {note.user?.role && (
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              {note.user.role}
            </span>
          )}
          <span
            className="text-xs text-slate-400 cursor-default"
            title={formatDateTime(note.createdAt)}
          >
            {formatRelativeTime(note.createdAt)}
          </span>
          {note.updatedAt !== note.createdAt && !isTemp && (
            <span className="text-[10px] text-slate-300 italic">edited</span>
          )}
        </div>

        {/* Note body / edit mode */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveEdit()
                if (e.key === "Escape") handleCancelEdit()
              }}
              rows={3}
              autoFocus
              className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Edit your note…"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveEdit}
                loading={updateNote.isPending}
                leftIcon={<Check className="h-3.5 w-3.5" />}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}
                leftIcon={<X className="h-3.5 w-3.5" />}>
                Cancel
              </Button>
              <span className="text-xs text-slate-400">Ctrl+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="bg-slate-50 rounded-md px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
              {note.note}
            </div>
            {/* Action buttons — appear on hover */}
            {!isTemp && (canEdit || canDelete) && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {canEdit && isOwner && (
                  <button
                    onClick={() => { setEditing(true); setTimeout(() => textareaRef.current?.focus(), 50) }}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    aria-label="Edit note"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {(canDelete && (isOwner || true)) && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { deleteNote.mutate(note.id); setConfirmDelete(false) }}
        title="Delete Note"
        description="This note will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={deleteNote.isPending}
      />
    </div>
  )
}

// ─── Notes Timeline (main export) ─────────────────────────────────────────
export function BookingNotesTab({ bookingId }: { bookingId: string }) {
  const { user }  = useAuth()
  const [text, setText] = useState("")
  const textareaRef     = useRef<HTMLTextAreaElement>(null)

  const { data: notes = [], isLoading } = useBookingNotes(bookingId)
  const createNote = useCreateNote(bookingId)

  const canEdit   = user?.role === "ADMIN" || user?.role === "MANAGER"
  const canDelete = user?.role === "ADMIN" || user?.role === "MANAGER"
  const canCreate = !!user  // all roles can create

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setText("")
    await createNote.mutateAsync(trimmed)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-medium text-slate-500">No notes yet</p>
            <p className="text-xs text-slate-400 mt-1">Add the first note below</p>
          </div>
        ) : (
          notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              currentUserId={user?.id ?? ""}
              canEdit={canEdit}
              canDelete={canDelete}
              bookingId={bookingId}
            />
          ))
        )}
      </div>

      {/* Composer */}
      {canCreate && (
        <div className="border-t border-slate-200 pt-4">
          <div className="flex gap-3">
            <Avatar name={`${user?.firstName ?? "U"} ${user?.lastName ?? ""}`} size="sm" className="shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Add an internal note… (Ctrl+Enter to submit)"
                className={cn(
                  "w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900",
                  "border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "resize-none placeholder:text-slate-400 transition-colors",
                )}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {text.length > 0 ? `${text.length} characters` : "Supports multi-line text"}
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  loading={createNote.isPending}
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
