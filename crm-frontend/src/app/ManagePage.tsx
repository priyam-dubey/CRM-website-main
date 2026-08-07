import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/app/EmptyState'
import { ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle } from '@/components/ui/Modal'
import { useBookingClasses, useCurrencies, useProviders, useCardProcessors, useCallQueues } from '@/hooks/useReferenceData'
import { useReferenceCrud, type ReferenceSection } from '@/hooks/useReferenceCrud'
import { usePermission } from '@/hooks/usePermission'
import { useDebounce } from '@/hooks/useDebounce'

type Section = 'classes'|'currencies'|'card-processors'|'providers'|'call-queues'

interface FieldConfig { name: string; label: string; placeholder?: string; optional?: boolean }

const SECTION_CONFIG: Record<Section, { label: string; singular: string; fields: FieldConfig[]; schema: z.ZodTypeAny; useList: () => any }> = {
  classes: {
    label: 'Classes', singular: 'Class',
    fields: [{ name: 'name', label: 'Class Name' }, { name: 'code', label: 'Code', placeholder: 'Y' }],
    schema: z.object({ name: z.string().min(1, 'Required').max(200), code: z.string().min(1, 'Required').max(10) }),
    useList: useBookingClasses,
  },
  currencies: {
    label: 'Currency', singular: 'Currency',
    fields: [
      { name: 'code', label: 'Code', placeholder: 'USD' },
      { name: 'name', label: 'Name', placeholder: 'US Dollar' },
      { name: 'symbol', label: 'Symbol', placeholder: '$' },
    ],
    schema: z.object({
      code: z.string().min(3, '3-letter code').max(3),
      name: z.string().min(1, 'Required').max(100),
      symbol: z.string().min(1, 'Required').max(5),
    }),
    useList: useCurrencies,
  },
  providers: {
    label: 'Providers', singular: 'Provider',
    fields: [{ name: 'name', label: 'Name' }, { name: 'logoUrl', label: 'Logo URL', placeholder: 'https://…', optional: true }],
    schema: z.object({ name: z.string().min(1, 'Required').max(200), logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')) }),
    useList: useProviders,
  },
  'card-processors': {
    label: 'Cards', singular: 'Card',
    fields: [{ name: 'name', label: 'Name' }, { name: 'shortCode', label: 'Sort Name', placeholder: 'VI' }],
    schema: z.object({ name: z.string().min(1, 'Required').max(200), shortCode: z.string().max(10).optional().or(z.literal('')) }),
    useList: useCardProcessors,
  },
  'call-queues': {
    label: 'Call Queue', singular: 'Call Queue',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'phone', label: 'Phone', placeholder: '9878967879', optional: true },
      { name: 'description', label: 'Description', optional: true },
    ],
    schema: z.object({
      name: z.string().min(1, 'Required').max(200),
      phone: z.string().max(30).optional().or(z.literal('')),
      description: z.string().max(500).optional().or(z.literal('')),
    }),
    useList: useCallQueues,
  },
}

const DISPLAY_COL_LABELS: Record<string, string> = {
  code: 'Currency', shortCode: 'Sort Name', name: 'Name', logoUrl: 'Logo', phone: 'Phone', symbol: 'Symbol',
}

function ItemFormDialog({ section, open, onClose, item }: { section: Section; open: boolean; onClose: () => void; item?: Record<string, any> }) {
  const config = SECTION_CONFIG[section]
  const { create, update } = useReferenceCrud(section as ReferenceSection)
  const isEdit = !!item

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Record<string, any>>({
    resolver: zodResolver(config.schema),
    defaultValues: item
      ? Object.fromEntries(config.fields.map(f => [f.name, item[f.name] ?? '']))
      : Object.fromEntries(config.fields.map(f => [f.name, ''])),
  })

  const onSubmit = async (values: Record<string, any>) => {
    // Drop empty-string optional fields so they come through as undefined, not ''
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === '' ? undefined : v]),
    )
    if (isEdit) {
      await update.mutateAsync({ id: item!.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent size="md">
        <DialogHeader><DialogTitle>{isEdit ? `Edit ${config.singular}` : `Add ${config.singular}`}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            {config.fields.map(f => (
              <FormField key={f.name} label={f.label} required={!f.optional} error={errors[f.name]?.message as string | undefined}>
                <Input placeholder={f.placeholder} {...register(f.name)} error={!!errors[f.name]} />
              </FormField>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : `Add ${config.singular}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ManagePage({ section }: { section: Section }) {
  const config = SECTION_CONFIG[section]
  const { data, isLoading, isError } = config.useList()
  const { remove } = useReferenceCrud(section as ReferenceSection)
  const canCreate = usePermission('manage', 'create')
  const canEdit   = usePermission('manage', 'edit')
  const canDelete = usePermission('manage', 'delete')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, any> | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const rows: Record<string, any>[] = (data?.data ?? []).filter((row: any) =>
    !debouncedSearch || String(row.name ?? row.code ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

  const keys = config.fields.map(f => f.name)

  return (
    <div className="space-y-4">
      <PageHeader
        title={config.label}
        subtitle={`Manage ${config.label.toLowerCase()}`}
        actions={canCreate ? (
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditItem(undefined); setFormOpen(true) }}>
            Add {config.singular}
          </Button>
        ) : undefined}
      />

      <div className="flex items-center gap-2">
        <Input
          placeholder={`Search…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftAddon={<Search className="h-4 w-4" />}
          className="max-w-xs"
        />
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">Failed to load {config.label.toLowerCase()}.</div>
        ) : rows.length === 0 ? (
          <EmptyState title={`No ${config.label.toLowerCase()} found`} description="Try adjusting your search, or add a new one." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {keys.map(k => (
                  <th key={k} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {DISPLAY_COL_LABELS[k] ?? k.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                  {keys.map(k => (
                    <td key={k} className="px-4 py-3 text-slate-900">
                      {k === 'logoUrl' && row[k]
                        ? <img src={row[k]} alt="" className="h-6 w-6 rounded object-contain" />
                        : <span className="text-sm">{String(row[k] ?? '—')}</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Badge variant={row.isActive ? 'success' : 'default'} dot>{row.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditItem(row); setFormOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <ItemFormDialog section={section} open={formOpen} item={editItem} onClose={() => { setFormOpen(false); setEditItem(undefined) }} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) remove.mutate(deleteId); setDeleteId(null) }}
        title={`Delete ${config.singular}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
      />
    </div>
  )
}
