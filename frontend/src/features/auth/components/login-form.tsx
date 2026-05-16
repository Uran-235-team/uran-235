import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/features/auth/api/use-auth'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { loginSchema } from '@/features/auth/lib/schemas'

export function LoginForm() {
  const mutation = useLoginMutation()
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
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
      </form>
    </AuthShell>
  )
}
