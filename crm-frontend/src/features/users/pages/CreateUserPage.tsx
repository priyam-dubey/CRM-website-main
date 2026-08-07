import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"
import { useCreateUser } from "../hooks/useUsers"
import { ROLE_LABELS } from "@/config/constants"

const schema = z.object({
  firstName: z.string().min(2, "Required").max(100),
  lastName:  z.string().min(2, "Required").max(100),
  email:     z.string().email("Invalid email"),
  role:      z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
  password:  z.string().min(8, "At least 8 characters").max(72),
})
type FormValues = z.infer<typeof schema>

export default function CreateUserPage() {
  const navigate = useNavigate()
  const createUser = useCreateUser()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "OPERATOR" },
  })

  const onSubmit = async (data: FormValues) => {
    await createUser.mutateAsync(data)
    navigate("/users")
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate("/users")}>
        Back to Users
      </Button>

      <PageHeader title="New User" subtitle="Add a new team member" />

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
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
            <FormField label="Role" required error={errors.role?.message}>
              <select {...register("role")} className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Temporary Password" required error={errors.password?.message}>
              <Input type="password" {...register("password")} error={!!errors.password} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate("/users")}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createUser.isPending}>Create User</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
