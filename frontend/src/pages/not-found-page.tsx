import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">404</p>
        <h1 className="font-heading mt-4 text-4xl font-semibold">Страница не найдена</h1>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          Этот маршрут пока не входит в текущую карту frontend. Вернитесь в dashboard.
        </p>
        <Button asChild className="mt-6 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
          <Link to="/dashboard">Открыть dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
