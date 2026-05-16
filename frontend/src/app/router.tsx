import { Suspense, lazy } from 'react'
import type { ReactNode } from 'react'

import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { AppShell } from '@/widgets/layout/app-shell'

const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/register-page').then((module) => ({ default: module.RegisterPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/dashboard-page').then((module) => ({ default: module.DashboardPage })),
)
const RulesPage = lazy(() =>
  import('@/pages/rules/rules-page').then((module) => ({ default: module.RulesPage })),
)
const RuleSetsPage = lazy(() =>
  import('@/pages/rule-sets/rule-sets-page').then((module) => ({ default: module.RuleSetsPage })),
)
const RuleAssignmentsPage = lazy(() =>
  import('@/pages/rule-assignments/rule-assignments-page').then((module) => ({
    default: module.RuleAssignmentsPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060b0d] px-6 text-center text-sm text-slate-300">
      Загружаем интерфейс…
    </div>
  )
}

function ProtectedLayout() {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/rule-sets" element={<RuleSetsPage />} />
            <Route path="/rule-assignments" element={<RuleAssignmentsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
