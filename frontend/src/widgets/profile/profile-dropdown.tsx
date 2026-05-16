import { useEffect } from 'react'

import {
  ChevronDown,
  KeyRound,
  LoaderCircle,
  LogOut,
  PencilLine,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUserQuery, useLogoutMutation } from '@/features/auth/api/use-auth'
import { useAuthStore } from '@/features/auth/model/auth-store'

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export function ProfileDropdown() {
  const { data, isLoading } = useCurrentUserQuery()
  const setUser = useAuthStore((state) => state.setUser)
  const persistedUser = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()

  useEffect(() => {
    if (data) {
      setUser(data)
    }
  }, [data, setUser])

  const user = data ?? persistedUser
  const displayName = user?.fullName || user?.username || 'Оператор'
  const initials = initialsFromName(displayName || 'Оператор')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 rounded-2xl border border-white/10 bg-white/5 px-3 hover:bg-white/10"
        >
          <Avatar className="size-8 border border-cyan-300/30">
            <AvatarFallback className="bg-cyan-300/15 text-xs font-semibold text-cyan-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-slate-400">{user?.email ?? 'Загрузка профиля'}</p>
          </div>
          <ChevronDown className="size-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-3xl border border-white/10 bg-slate-950/95 p-2 text-white shadow-[0_30px_80px_rgba(2,6,23,0.9)] backdrop-blur-2xl"
      >
        <DropdownMenuLabel className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-4">
            <Avatar className="size-12 border border-cyan-300/30">
              <AvatarFallback className="bg-cyan-300/15 text-sm font-semibold text-cyan-100">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold text-white">{displayName}</p>
              <p className="text-sm text-slate-400">{user?.email ?? 'Email пока отсутствует'}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="size-3.5 text-cyan-300" />
                <span>{isLoading ? 'Синхронизация профиля' : user?.username ?? 'Неизвестный пользователь'}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Пароль</span>
              <span className="font-mono tracking-[0.35em]">••••••••</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 bg-white/10" />
        <DropdownMenuItem
          className="rounded-2xl px-3 py-3 text-slate-300 focus:bg-white/8 focus:text-white"
          onSelect={() => toast.info('Редактирование профиля пока подготовлено как frontend-заглушка до поддержки на backend.')}
        >
          <PencilLine className="mr-2 size-4" />
          Изменить профиль
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-2xl px-3 py-3 text-slate-300 focus:bg-white/8 focus:text-white"
          onSelect={() => toast.info('Сценарий сброса пароля зарезервирован под следующую backend auth-итерацию.')}
        >
          <KeyRound className="mr-2 size-4" />
          Сбросить пароль
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2 bg-white/10" />
        <DropdownMenuItem
          className="rounded-2xl px-3 py-3 text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
          onSelect={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 size-4" />
          )}
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
