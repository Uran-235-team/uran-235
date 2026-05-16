import type { PropsWithChildren } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="dark" forcedTheme="dark" attribute="class">
      <QueryProvider>
        <TooltipProvider delayDuration={120}>
          {children}
          <Toaster
            theme="dark"
            richColors
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  'border border-white/10 bg-slate-950/90 text-slate-100 shadow-2xl backdrop-blur-xl',
                description: 'text-slate-400',
              },
            }}
          />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
