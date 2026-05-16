import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { useRegisterMutation } from '@/features/auth/api/use-auth'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { registerSchema } from '@/features/auth/lib/schemas'

export function RegisterForm() {
  const mutation = useRegisterMutation()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <AuthShell
      title="Регистрация"
      footer={
        <>
          Уже есть аккаунт?
          <Link className="text-link" to="/login">
            Войти
          </Link>
        </>
      }
    >
      <form
        onSubmit={form.handleSubmit(({ username, password }) =>
          mutation.mutate({ username, password }),
        )}
      >
        <label className="field">
          <span>Логин</span>
          <input autoComplete="username" {...form.register('username')} />
        </label>
        {form.formState.errors.username ? (
          <p className="mb-4 text-xs text-rose-300">{form.formState.errors.username.message}</p>
        ) : null}

        <label className="field">
          <span>Пароль</span>
          <input type="password" autoComplete="new-password" {...form.register('password')} />
        </label>
        {form.formState.errors.password ? (
          <p className="mb-4 text-xs text-rose-300">{form.formState.errors.password.message}</p>
        ) : null}

        <label className="field confirm-field">
          <span>Подтвердите пароль</span>
          <input
            type="password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
        </label>
        {form.formState.errors.confirmPassword ? (
          <p className="mb-4 text-xs text-rose-300">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}

        <button className="primary-action btn-slice magnetic" type="submit" disabled={mutation.isPending}>
          <span className="top" aria-hidden="true">
            <span className="auth-label">
              {mutation.isPending ? 'Создаём' : 'Зарегистрироваться'}
            </span>
          </span>
          <span className="bottom" aria-hidden="true">
            <span className="auth-label">
              {mutation.isPending ? 'Создаём' : 'Зарегистрироваться'}
            </span>
          </span>
        </button>
        {mutation.isPending ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <LoaderCircle className="size-4 animate-spin" />
            Создаём аккаунт
          </div>
        ) : null}
      </form>
    </AuthShell>
  )
}
