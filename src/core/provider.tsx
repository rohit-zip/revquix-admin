"use client"

import React from "react"
import { Provider as ReduxProvider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { useTheme } from "next-themes"
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react"
import { store } from "./store"
import { queryClient } from "./query-client"
import AuthInitializer from "@/components/auth-initializer"
import AuthCheckLoader from "@/components/auth-check-loader"
import NotificationInitializer from "@/components/notification-initializer"

const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

// ─── AppToaster ───────────────────────────────────────────────────────────────
// Separated into its own component so useTheme() can be called inside the
// ThemeProvider tree, preventing a flash of incorrect toast styling on theme load.
function AppToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      // Sync with next-themes so dark/light switches are reflected immediately
      theme={resolvedTheme as "light" | "dark" | "system" | undefined}
      // Desktop: top-right. Mobile: overridden to bottom-center via CSS.
      position="top-right"
      closeButton
      // Always expand the toast stack so multiple toasts are fully readable
      expand
      // Allow up to 4 simultaneous toasts before older ones are dismissed
      visibleToasts={4}
      // Tighter gap between stacked toasts
      gap={8}
      // Default duration — individual helpers override per-variant
      duration={5000}
      // Override Sonner's built-in SVG icons with Lucide for visual consistency
      icons={{
        success: <CheckCircle2 className="size-4.25" />,
        error: <XCircle className="size-4.25" />,
        warning: <AlertTriangle className="size-4.25" />,
        info: <Info className="size-4.25" />,
        loading: <Loader2 className="size-4.25 animate-spin" />,
      }}
    />
  )
}

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
            {!isMaintenanceMode && <NotificationInitializer />}
            {!isMaintenanceMode && <AuthCheckLoader />}
            {children}
            <AppToaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  )
}

