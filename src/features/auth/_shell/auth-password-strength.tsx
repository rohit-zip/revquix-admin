/**
 * AuthPasswordStrength - rendered beneath any new-password field in the admin
 * console. Shows a 4-segment strength meter and a checklist of rule outcomes.
 *
 * The score and rule state come from `usePasswordRules`, which mirrors the server's
 * `@ValidPassword` rule exactly - so a fully-ticked checklist is a password the
 * server will accept, and that is the property worth having.
 *
 * A deliberate mirror of the same component in `revquix-web`, sized to this
 * console's type scale (`text-xs`).
 */

import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PasswordRuleResult, PasswordStrength } from "../_hooks/use-password-rules"

interface AuthPasswordStrengthProps {
  rules: ReadonlyArray<PasswordRuleResult>
  strength: PasswordStrength
  /** Hide entirely when no input - keeps the layout calm. */
  visible: boolean
}

const SEGMENT_COUNT = 4

const SEGMENT_TONE: Record<PasswordStrength["tone"], string> = {
  weak: "bg-destructive",
  fair: "bg-amber-500",
  good: "bg-yellow-500",
  strong: "bg-emerald-500",
}

const LABEL_TONE: Record<PasswordStrength["tone"], string> = {
  weak: "text-destructive",
  fair: "text-amber-600 dark:text-amber-400",
  good: "text-yellow-600 dark:text-yellow-400",
  strong: "text-emerald-600 dark:text-emerald-400",
}

export default function AuthPasswordStrength({
  rules,
  strength,
  visible,
}: AuthPasswordStrengthProps) {
  if (!visible) return null

  return (
    <div className="space-y-2.5" aria-live="polite">
      {/* Segmented bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
            const filled = i < strength.score
            return (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  filled ? SEGMENT_TONE[strength.tone] : "bg-muted"
                )}
              />
            )
          })}
        </div>
        <span className={cn("text-xs font-medium tabular-nums", LABEL_TONE[strength.tone])}>
          {strength.label}
        </span>
      </div>

      {/* Rule checklist */}
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              rule.met ? "text-foreground/80" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full",
                rule.met
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {rule.met ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
