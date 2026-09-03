/**
 * ─── "WHICH APP ARE YOU USING?" ──────────────────────────────────────────────
 *
 * A radio group over {@link AUTHENTICATOR_APPS}, asked once during forced enrolment and stored with
 * the factor so a settings screen can answer it later.
 *
 * ─── ⚠ Twin of `revquix-web/src/features/dashboard/user/components/mfa/mfa-app-picker.tsx` ─────
 * Same behaviour, this console's plainer type scale. Keep them in step.
 *
 * Nothing in TOTP identifies the app, so if this is not asked here it can never be answered for an
 * admin — the console has no settings route to ask on later. It stays optional, and it must never
 * gate the primary action: skipping it costs nothing but a vaguer record.
 *
 * ─── Why pills that hug their text, and not a grid ───────────────────────────
 *
 * This was a two-column grid, and a grid forces every cell to the width of the widest: "Authy" got
 * the same box as "Microsoft Authenticator" and carried most of it as dead space. Worse in this
 * console than in the app, because JetBrains Mono is the body face here — the long names overran
 * their cells while the short ones sat in half-empty ones.
 *
 * Pills size to their content, so nothing overruns and nothing is padded out with nothing, and the
 * row wraps naturally inside the 384px auth column.
 */

"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { AUTHENTICATOR_APPS, type AuthenticatorAppId } from "./authenticator-apps"

interface MfaAppPickerProps {
  value: AuthenticatorAppId | null
  onChange: (next: AuthenticatorAppId) => void
  disabled?: boolean
  className?: string
}

export default function MfaAppPicker({ value, onChange, disabled, className }: MfaAppPickerProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium">Which app are you using?</p>
        <p className="text-[11px] text-muted-foreground">Optional</p>
      </div>

      <div
        role="radiogroup"
        aria-label="Which authenticator app are you using?"
        className="flex flex-wrap gap-1.5"
      >
        {AUTHENTICATOR_APPS.map((app) => {
          const selected = value === app.id
          return (
            <button
              key={app.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(app.id)}
              className={cn(
                "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1 transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-60",
                selected
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "bg-background hover:border-foreground/20 hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  app.tone,
                )}
                aria-hidden
              >
                {app.monogram}
              </span>
              {/* `truncate` is safe on a pill in a wrapping row — unlike in the grid this replaced,
                  the pill is only ever as wide as it needs to be, so this fires solely on a viewport
                  narrower than one name. */}
              <span className="truncate text-[11px]">{app.name}</span>
              {selected && <Check className="size-3 shrink-0" aria-hidden />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
