import type { PropsWithChildren } from 'react'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeProviderProps = PropsWithChildren<{
  attribute: 'class'
  defaultTheme: string
  forcedTheme: string
}>

export function ThemeProvider({
  children,
  attribute,
  defaultTheme,
  forcedTheme,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
