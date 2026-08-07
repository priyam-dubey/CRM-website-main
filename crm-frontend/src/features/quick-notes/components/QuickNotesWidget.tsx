import { useEffect, useRef, useState } from 'react'
import type { QuickNote } from '@/types/quick-note.types'
import { NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, DrawerTitle, DrawerDescription } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCreateQuickNote } from '../hooks/useQuickNotes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { quickNoteService } from '@/services/quick-note.service'
import { getErrorMessage } from '@/lib/api-client'
import { cn, formatRelativeTime } from '@/lib/utils'
// Removed duplicate import

const MAX_LENGTH = 5000
const PULSE_INTERVAL_MS = 8000
const PULSE_DURATION_MS = 1200

export function QuickNotesWidget() {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createNote = useCreateQuickNote()
  const { user: currentUser } = useAuth()
  const userId = currentUser?.id
  const { data: history = [], refetch: refetchHistory, isLoading: historyLoading } = useQuery<QuickNote[]>({
    queryKey: ['quickNotesHistory', userId],
    queryFn: () => quickNoteService.list(1, 100, userId),
    enabled: !!userId,
  })

  // Small periodic pulse — draws the eye every few seconds without being a
  // constant distraction (unlike Tailwind's built-in `animate-ping`, which
  // loops continuously).
  useEffect(() => {
    if (open) return
    const interval = setInterval(() => {
      setPulsing(true)
      setTimeout(() => setPulsing(false), PULSE_DURATION_MS)
    }, PULSE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [open])

  // Global shortcut: Ctrl+Shift+N opens the drawer from anywhere.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-grow the textarea as the user types.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [note, open])

  function handleSave() {
    const trimmed = note.trim()
    if (!trimmed) {
      toast.error('Write something before saving.')
      return
    }
    createNote.mutate(trimmed, {
      onSuccess: () => {
        toast.success('Note saved')
        setNote('')
        setOpen(false)
        // Refresh history after saving
        if (showHistory) {
          void refetchHistory()
        }
      },
      onError: (err) => {
        toast.error(getErrorMessage(err))
      },
    })
  }

  function handleKeyDownInTextarea(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Tooltip content="Quick Notes" side="left">
          <button
            type="button"
            aria-label="Open Quick Notes"
            onClick={() => setOpen(true)}
            className={cn(
              'relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full',
              'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
              'shadow-[0_8px_24px_-4px_rgba(37,99,235,0.5)]',
              'transition-transform duration-200 ease-out hover:scale-110 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2',
            )}
          >
            {pulsing && (
              <span className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-60" />
            )}
            <NotebookPen className="h-6 w-6 sm:h-7 sm:w-7 relative" strokeWidth={2} />
          </button>
        </Tooltip>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          className="w-full sm:w-[420px]"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            textareaRef.current?.focus()
          }}
        >
          <DrawerHeader>
            <DrawerTitle>Quick Notes</DrawerTitle>
            <DrawerDescription>Save internal notes for this CRM.</DrawerDescription>
          </DrawerHeader>

          <DrawerBody>
            {showHistory ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historyLoading ? (
                  <p className="text-sm text-slate-500">Loading...</p>
                ) : history && history.length > 0 ? (
                  history.map((note) => (
                    <div key={note.id} className="border-b pb-2 mb-2">
                      <p className="text-sm text-slate-900">{note.note}</p>
                      <p className="text-xs text-slate-400">{formatRelativeTime(note.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No notes found.</p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, MAX_LENGTH))}
                  onKeyDown={handleKeyDownInTextarea}
                  placeholder="Write your note..."
                  aria-label="Quick note text"
                  disabled={createNote.isPending}
                  className={cn(
                    'w-full min-h-[160px] resize-none rounded-md border border-slate-200 p-3 text-sm text-slate-900',
                    'placeholder:text-slate-400',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500',
                    'disabled:opacity-60',
                  )}
                />
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span>Tip: Ctrl+Enter to save</span>
                  <span className={note.length >= MAX_LENGTH ? 'text-error font-medium' : ''}>
                    {note.length} / {MAX_LENGTH}
                  </span>
                </div>
              </>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={createNote.isPending}>
              Cancel
            </Button>
            {showHistory ? (
              <Button variant="outline" onClick={() => setShowHistory(false)}>
                Hide History
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowHistory(true)}>
                Previous Notes
              </Button>
            )}
            <Button onClick={handleSave} loading={createNote.isPending} disabled={!note.trim()}>
              Save Note
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
