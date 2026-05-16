import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterMutation } from '@/features/auth/api/use-auth'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { registerSchema } from '@/features/auth/lib/schemas'

export function RegisterForm() {
  const mutation = useRegisterMutation()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <AuthShell
      title="Создание аккаунта"
      description="Экран регистрации уже работает с backend auth flow, а остальная часть продукта пока использует typed stubs, которые потом заменятся на реальные currency и rule endpoints."
      footer={
        <span>
          Уже есть доступ?{' '}
          <Link className="text-cyan-300 transition hover:text-cyan-200" to="/login">
            Войти
          </Link>
        </span>
      }
    >
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(({ confirmPassword, ...values }) =>
          mutation.mutate(values),
        )}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              className="h-12 border-white/10 bg-white/5"
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName ? (
              <p className="text-xs text-rose-300">
                {form.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              className="h-12 border-white/10 bg-white/5"
              {...form.register('username')}
            />
            {form.formState.errors.username ? (
              <p className="text-xs text-rose-300">
                {form.formState.errors.username.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="h-12 border-white/10 bg-white/5"
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-rose-300">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              className="h-12 border-white/10 bg-white/5"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-300">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="h-12 border-white/10 bg-white/5"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-rose-300">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
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
              Создаем аккаунт
            </>
          ) : (
            'Открыть workspace'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
