"use client"

import React from "react"
import { Provider as ReduxProvider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { store } from "./store"
import { queryClient } from "./query-client"
import AuthInitializer from "@/components/auth-initializer"
import AuthCheckLoader from "@/components/auth-check-loader"

const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

export function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute={"class"}
          defaultTheme={"dark"}
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {!isMaintenanceMode && <AuthInitializer />}
            {!isMaintenanceMode && <AuthCheckLoader />}
            {children}
            <Toaster
              richColors
              position="top-right"
              closeButton
              duration={5000}
            />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  )
}

