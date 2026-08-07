import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Globe } from "lucide-react"
import { PageHeader }   from "@/components/app/PageHeader"
import { Button }       from "@/components/ui/Button"
import { Badge }        from "@/components/ui/Badge"
import { Input }        from "@/components/ui/Input"
import { FormField }    from "@/components/ui/FormField"
import { ErrorState }   from "@/components/app/ErrorState"
import { Skeleton }     from "@/components/ui/Skeleton"
import { ConfirmDialog } from "@/components/ui/Modal"
import { useIpRules, useCreateIpRule, useUpdateIpRule, useDeleteIpRule, useIpSettingsSummary, useToggleIpRestriction } from "../hooks/useSecurity"
import { usePermission } from "@/hooks/usePermission"
import { formatDateTime, cn } from "@/lib/utils"
import type { IPRule } from "@/types/shared.types"

const ruleSchema = z.object({
  cidr: z.string().min(3, "Required").max(45),
  type: z.enum(["ALLOW", "DENY"]),
  description: z.string().max(500).optional().or(z.literal("")),
})
type RuleFormValues = z.infer<typeof ruleSchema>

export default function IPRulesPage() {
  const { data, isLoading, isError, refetch } = useIpRules({ per_page: 100 })
  const { data: summary } = useIpSettingsSummary()
  const toggleRestriction = useToggleIpRestriction()
  const createRule = useCreateIpRule()
  const updateRule = useUpdateIpRule()
  const deleteRule = useDeleteIpRule()
  const canManage = usePermission("security", "manage")

  const [filter, setFilter] = useState<"all"|"allowed"|"blocked">("all")
  const [search, setSearch] = useState("")
  const [editingRule, setEditingRule] = useState<IPRule | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { type: "ALLOW" },
  })

  const onSubmit = async (values: RuleFormValues) => {
    const payload = { ...values, description: values.description || undefined }
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, data: payload })
      setEditingRule(null)
    } else {
      await createRule.mutateAsync(payload as any)
    }
    reset({ type: "ALLOW", cidr: "", description: "" })
  }

  if (isError) return <ErrorState title="Failed to load IP rules" onRetry={refetch} />

  const rules = (data?.data ?? []).filter(r => {
    if (filter === "allowed" && r.type !== "ALLOW") return false
    if (filter === "blocked" && r.type !== "DENY")  return false
    if (search && !r.cidr.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <PageHeader title="IP Settings" subtitle="Control access by IP address or CIDR range" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Add IP Address form */}
        <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
            <Plus className="h-4 w-4" /> Add IP Address
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="IP Address" required error={errors.cidr?.message}>
                <Input placeholder="IPv4 or IPv6 address" {...register("cidr")} error={!!errors.cidr} />
              </FormField>
              <FormField label="Access" required>
                <select {...register("type")} className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value="ALLOW">Allow</option>
                  <option value="DENY">Block</option>
                </select>
              </FormField>
            </div>
            <FormField label="Description">
              <Input placeholder="Office Network" {...register("description")} />
            </FormField>
            <Button type="submit" loading={isSubmitting} className="w-full">
              {editingRule ? "Save Changes" : "Add IP"}
            </Button>
            {editingRule && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setEditingRule(null); reset({ type: "ALLOW", cidr: "", description: "" }) }}>
                Cancel edit
              </Button>
            )}
          </form>
        </div>

        {/* Security Status */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Security Status</h2>
            {canManage ? (
              <button
                onClick={() => toggleRestriction.mutate(!summary?.enabled)}
                className={cn("text-xs font-medium px-2 py-1 rounded-full",
                  summary?.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}
              >
                {summary?.enabled ? "Activated" : "Deactivated"}
              </button>
            ) : (
              <Badge variant={summary?.enabled ? "success" : "error"}>{summary?.enabled ? "Activated" : "Deactivated"}</Badge>
            )}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Allowed IPs</dt><dd className="font-medium text-slate-900">{summary?.allowedCount ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Blocked IPs</dt><dd className="font-medium text-slate-900">{summary?.blockedCount ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Last Updated</dt><dd className="text-slate-500">{summary?.lastUpdatedAt ? formatDateTime(summary.lastUpdatedAt) : "—"}</dd></div>
          </dl>
        </div>
      </div>

      {/* IP Access List */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">IP Access List</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search IP…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 max-w-[160px]" />
            {(["all","allowed","blocked"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rules.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">No IP rules configured</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-mono text-sm text-slate-900">{rule.cidr}</p>
                    {rule.description && <p className="text-xs text-slate-500">{rule.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={rule.type === "ALLOW" ? "success" : "error"}>{rule.type === "ALLOW" ? "Allowed" : "Blocked"}</Badge>
                  {canManage && (
                    <>
                      <button className="text-xs text-blue-600 hover:underline"
                        onClick={() => { setEditingRule(rule); reset({ cidr: rule.cidr, type: rule.type, description: rule.description ?? "" }) }}>
                        Edit
                      </button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => setDeletingId(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) { deleteRule.mutate(deletingId); setDeletingId(null) } }}
        title="Delete IP Rule"
        description="This IP rule will be permanently removed. Access restrictions will update immediately."
        confirmLabel="Delete"
        destructive
        loading={deleteRule.isPending}
      />
    </div>
  )
}
