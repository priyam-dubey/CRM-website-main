import { useForm }  from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z }        from "zod"
import { useAuth }  from "@/features/auth/hooks/useAuth"
import { useUpdateUser } from "@/features/users/hooks/useUsers"
import { PageHeader } from "@/components/app/PageHeader"
import { Avatar }   from "@/components/ui/Avatar"
import { Badge }    from "@/components/ui/Badge"
import { Button }   from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input }    from "@/components/ui/Input"
import { ROLE_LABELS } from "@/config/constants"

const schema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName:  z.string().min(2, "Required"),
  email:     z.string().email("Invalid email"),
})
type FormValues = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const updateUser = useUpdateUser(user?.id ?? "")

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, email: user?.email },
  })

  const onSubmit = async (data: FormValues) => {
    await updateUser.mutateAsync(data)
    await refreshUser()
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your personal information" />

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
          <div>
            <p className="text-lg font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <Badge variant="primary" className="mt-1">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required error={errors.firstName?.message}>
              <Input {...register("firstName")} error={!!errors.firstName} />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName?.message}>
              <Input {...register("lastName")} error={!!errors.lastName} />
            </FormField>
            <FormField label="Email" required error={errors.email?.message} className="sm:col-span-2">
              <Input type="email" {...register("email")} error={!!errors.email} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting || updateUser.isPending} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
