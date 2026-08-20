import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Logo } from '@/components/app/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('root', { message: 'Invalid email or password. Try admin@demo.com / password' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo heightClassName="h-12" className="mx-auto mb-4" />
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {errors.root && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            )}
            <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input id="email" type="email" autoComplete="email" autoFocus
                placeholder="admin@demo.com" leftAddon={<Mail className="h-4 w-4" />}
                error={!!errors.email} {...register('email')} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
              <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                placeholder="••••••••" leftAddon={<Lock className="h-4 w-4" />}
                rightAddon={
                  <button type="button" className="pointer-events-auto"
                    onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={!!errors.password} {...register('password')} />
            </FormField>
            <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
          </form>
          <p className="mt-4 text-xs text-center text-slate-400">
            Demo credentials: admin@demo.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
