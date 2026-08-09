"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ExternalLink,
  Gift,
  Megaphone,
  Monitor,
  Moon,
  Smartphone,
  Sparkles,
  Sun,
  Tablet,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import type {
  AnnouncementAppearance,
  AnnouncementCtaRequest,
  AnnouncementIcon,
} from "./api/announcement.types"

/**
 * ─── LIVE PREVIEW ────────────────────────────────────────────────────────────
 *
 * Renders the bar exactly as a visitor sees it, at three widths and in both
 * themes, beside the form.
 *
 * ─── Why this is not a nicety ───────────────────────────────────────────────
 *
 * The message cap is 90 characters, which comfortably fits one desktop line and
 * wraps to three on a 360px phone. An admin writing in a 1440px browser has no
 * way to discover that, and the failure is invisible from where they are
 * standing — a two-line banner shoving the navbar down on every mobile page,
 * reported days later by somebody else. The breakpoint switcher below is the
 * only feedback loop that closes before publish rather than after.
 *
 * ─── Why the colours are duplicated from revquix-web's globals.css ──────────
 *
 * They are the same six token pairs, restated here because the two apps do not
 * share a stylesheet. That duplication is real and worth naming: if an
 * appearance is ever retuned in `revquix-web`, this file has to follow or the
 * preview becomes a confident lie. The alternative — a shared package for six
 * colour pairs — is more machinery than the risk warrants at this size, but the
 * risk is not zero.
 */

const ICONS: Record<AnnouncementIcon, LucideIcon> = {
  SPARKLES: Sparkles,
  ZAP: Zap,
  MEGAPHONE: Megaphone,
  GIFT: Gift,
  ALERT_TRIANGLE: AlertTriangle,
  WRENCH: Wrench,
}

/** Mirrors the `[data-announcement-appearance]` rules in revquix-web/src/app/globals.css. */
const APPEARANCE_STYLES: Record<AnnouncementAppearance, { light: Palette; dark: Palette }> = {
  ACCENT: {
    light: { bg: "var(--primary-500)", fg: "oklch(1 0 0)" },
    dark: { bg: "var(--primary-400)", fg: "oklch(0.145 0 0)" },
  },
  ACCENT_SOFT: {
    light: { bg: "var(--primary-50)", fg: "var(--primary-700)", border: "var(--primary-100)" },
    dark: { bg: "var(--primary-950)", fg: "var(--primary-200)", border: "var(--primary-900)" },
  },
  NEUTRAL: {
    light: { bg: "oklch(0.155 0 0)", fg: "oklch(0.985 0 0)" },
    dark: { bg: "oklch(0.965 0 0)", fg: "oklch(0.145 0 0)" },
  },
  SUCCESS: {
    light: { bg: "oklch(0.527 0.130 158)", fg: "oklch(1 0 0)" },
    dark: { bg: "oklch(0.700 0.150 160)", fg: "oklch(0.145 0 0)" },
  },
  WARNING: {
    light: { bg: "oklch(0.520 0.135 70)", fg: "oklch(1 0 0)" },
    dark: { bg: "oklch(0.800 0.150 74)", fg: "oklch(0.145 0 0)" },
  },
  CRITICAL: {
    light: { bg: "oklch(0.505 0.190 27)", fg: "oklch(1 0 0)" },
    dark: { bg: "oklch(0.680 0.200 25)", fg: "oklch(0.145 0 0)" },
  },
}

interface Palette {
  bg: string
  fg: string
  border?: string
}

const WIDTHS = [
  { key: "mobile", label: "360", icon: Smartphone, px: 360 },
  { key: "tablet", label: "768", icon: Tablet, px: 768 },
  { key: "desktop", label: "1440", icon: Monitor, px: 1440 },
] as const

type WidthKey = (typeof WIDTHS)[number]["key"]

export interface AnnouncementPreviewProps {
  message: string
  shortMessage: string
  appearance: AnnouncementAppearance
  icon: AnnouncementIcon | null
  cta: AnnouncementCtaRequest | null
  dismissible: boolean
}

export function AnnouncementPreview(props: AnnouncementPreviewProps) {
  const [width, setWidth] = useState<WidthKey>("desktop")
  const [dark, setDark] = useState(false)

  const active = WIDTHS.find((w) => w.key === width) ?? WIDTHS[2]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border p-0.5">
          {WIDTHS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setWidth(option.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  width === option.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={width === option.key}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {option.label}
              </button>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDark((value) => !value)}
          className="gap-1.5"
        >
          {dark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          {dark ? "Dark" : "Light"}
        </Button>
      </div>

      {/*
        The viewport frame is scaled down rather than actually 1440px wide, so
        all three breakpoints fit in the editor's right-hand pane. `transform:
        scale` preserves the true wrapping behaviour — a CSS-width-only fake
        would re-wrap at the container's real width and show the admin a layout
        no visitor ever gets, which is worse than showing nothing.
      */}
      <div className="overflow-hidden rounded-lg border bg-muted/30 p-3">
        <div className="mx-auto overflow-x-auto">
          <div
            style={{
              width: active.px,
              transform: `scale(${Math.min(1, 520 / active.px)})`,
              transformOrigin: "top left",
              height: `calc(var(--preview-h, 3rem) * ${Math.min(1, 520 / active.px)})`,
            }}
          >
            <PreviewBar {...props} dark={dark} narrow={active.px < 480} />
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {props.shortMessage && active.px < 480
          ? "Below 480px the short message is shown instead of the full one."
          : "The full message is shown at this width."}
      </p>
    </div>
  )
}

function PreviewBar({
  message,
  shortMessage,
  appearance,
  icon,
  cta,
  dismissible,
  dark,
  narrow,
}: AnnouncementPreviewProps & { dark: boolean; narrow: boolean }) {
  const palette = APPEARANCE_STYLES[appearance][dark ? "dark" : "light"]
  const Icon = icon ? ICONS[icon] : null

  // Mirrors the public bar's rule: below 480px the short message REPLACES the
  // full one rather than truncating it. Without this the preview would show the
  // full message at 360px and quietly defeat the entire breakpoint switcher —
  // an admin would check the narrow view, see their long message fit, and ship
  // a bar that wraps to three lines on a real phone.
  const active = narrow && shortMessage.trim() ? shortMessage : message

  // Empty state, so the preview pane is never a blank rectangle while the admin
  // is still typing the first field.
  const displayed = active.trim() || "Your announcement message will appear here"

  return (
    <div
      className={cn("relative isolate w-full px-4 py-2.5 sm:px-6", dark && "dark")}
      style={{
        backgroundColor: palette.bg,
        color: palette.fg,
        borderBottom: `1px solid ${palette.border ?? "transparent"}`,
      }}
    >
      <div className="mx-auto flex min-h-[1.25rem] max-w-7xl items-center justify-center gap-x-3">
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}

        <p className="text-center text-[13px] font-medium leading-5 sm:text-sm">{displayed}</p>

        {cta?.label ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap text-[13px] font-semibold",
              cta.style === "PILL" ? "rounded-full px-3 py-1 leading-5" : "underline underline-offset-2",
            )}
            style={
              cta.style === "PILL"
                ? { backgroundColor: palette.fg, color: palette.bg }
                : undefined
            }
          >
            {cta.label}
            {cta.href && !cta.href.startsWith("/") ? (
              <ExternalLink className="ml-1 size-3 shrink-0" aria-hidden="true" />
            ) : null}
          </span>
        ) : null}
      </div>

      {dismissible ? (
        <span className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md opacity-70 sm:right-3">
          <X className="size-4" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  )
}
