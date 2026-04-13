"use client"

import { useState } from "react"
import { X, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BannerItem {
  id: string
  type: "info" | "warning" | "success" | "error"
  message: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** If true, the banner can be dismissed */
  dismissible?: boolean
}

interface CentralizedBannerProps {
  banners: BannerItem[]
  onDismiss?: (bannerId: string) => void
  className?: string
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
}

const colorMap = {
  info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  success: "bg-green-500/10 border-green-500/20 text-green-400",
  error: "bg-red-500/10 border-red-500/20 text-red-400",
}

const buttonColorMap = {
  info: "bg-blue-600 hover:bg-blue-700 text-white",
  warning: "bg-amber-600 hover:bg-amber-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  error: "bg-red-600 hover:bg-red-700 text-white",
}

/**
 * Centralized banner component that can show multiple banners for various reasons.
 * Banners can be of type: info, warning, success, or error.
 * Each banner can have an optional action button and can be dismissible.
 *
 * Usage:
 * ```tsx
 * <CentralizedBanner
 *   banners={[
 *     { id: "1", type: "warning", message: "You have 1 booking that needs a meeting link.", action: { label: "Set Link", onClick: () => {} } },
 *     { id: "2", type: "info", message: "Connect Google Calendar for automatic Meet links." },
 *   ]}
 *   onDismiss={(id) => console.log("dismissed", id)}
 * />
 * ```
 */
export function CentralizedBanner({ banners, onDismiss, className }: CentralizedBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleBanners = banners.filter((b) => !dismissed.has(b.id))

  if (visibleBanners.length === 0) return null

  function handleDismiss(bannerId: string) {
    setDismissed((prev) => new Set(prev).add(bannerId))
    onDismiss?.(bannerId)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {visibleBanners.map((banner) => {
        const Icon = iconMap[banner.type]
        return (
          <div
            key={banner.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
              colorMap[banner.type]
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{banner.message}</span>
            {banner.action && (
              <button
                onClick={banner.action.onClick}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  buttonColorMap[banner.type]
                )}
              >
                {banner.action.label}
              </button>
            )}
            {(banner.dismissible ?? true) && (
              <button
                onClick={() => handleDismiss(banner.id)}
                className="shrink-0 rounded p-0.5 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="size-3.5" />
                <span className="sr-only">Dismiss</span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}


