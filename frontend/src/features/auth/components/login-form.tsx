import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/features/auth/api/use-auth'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { loginSchema } from '@/features/auth/lib/schemas'
import { useAuthStore } from '@/features/auth/model/auth-store'

export function LoginForm() {
  const navigate = useNavigate()
  const mutation = useLoginMutation()
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin',
      password: 'admin123',
    },
  })

  return (
    <AuthShell
      title="С возвращением"
      description="Вход идет через backend auth API. Если API недоступен, форма покажет реальную ошибку, а не тихо замокает поведение."
      footer={
        <span>
          Впервые здесь?{' '}
          <Link className="text-cyan-300 transition hover:text-cyan-200" to="/register">
            Создать аккаунт
          </Link>
        </span>
      }
    >
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <Label htmlFor="username">Логин</Label>
          <Input
            id="username"
            placeholder="admin"
            className="h-12 border-white/10 bg-white/5"
            {...form.register('username')}
          />
          {form.formState.errors.username ? (
            <p className="text-xs text-rose-300">
              {form.formState.errors.username.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-12 border-white/10 bg-white/5"
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-rose-300">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Входим
            </>
          ) : (
            'Войти в dashboard'
          )}
        </Button>
        {import.meta.env.DEV ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              setSession({
                accessToken: 'dev-preview-access',
                refreshToken: 'dev-preview-refresh',
              })
              setUser({
                username: 'preview',
                email: 'preview@uran.local',
                fullName: 'Preview Operator',
                isActive: true,
              })
              navigate('/dashboard', { replace: true })
            }}
          >
            Открыть превью без backend
          </Button>
        ) : null}
      </form>
    </AuthShell>
  )
}
