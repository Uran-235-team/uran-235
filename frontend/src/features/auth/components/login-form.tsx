import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

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
      title="Вход"
      footer={
        <>
          Нет аккаунта?
          <Link className="text-link" to="/register">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <label className="field">
          <span>Логин</span>
          <input autoComplete="username" {...form.register('username')} />
        </label>
        {form.formState.errors.username ? (
          <p className="mb-4 text-xs text-rose-300">{form.formState.errors.username.message}</p>
        ) : null}

        <label className="field">
          <span>Пароль</span>
          <input type="password" autoComplete="current-password" {...form.register('password')} />
        </label>
        {form.formState.errors.password ? (
          <p className="mb-4 text-xs text-rose-300">{form.formState.errors.password.message}</p>
        ) : null}

        <button className="primary-action btn-slice magnetic" type="submit" disabled={mutation.isPending}>
          <span className="top" aria-hidden="true">
            <span className="auth-label">
              {mutation.isPending ? 'Входим' : 'Войти'}
            </span>
          </span>
          <span className="bottom" aria-hidden="true">
            <span className="auth-label">
              {mutation.isPending ? 'Входим' : 'Войти'}
            </span>
          </span>
        </button>
        {mutation.isPending ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <LoaderCircle className="size-4 animate-spin" />
            Подключаем сессию
          </div>
        ) : null}
      </form>
    </AuthShell>
  )
}
