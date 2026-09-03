/**
 * usePasswordRules - single source of truth for password validation rules across
 * every admin surface that sets a password: registration, forgot-password, and the
 * change/add-password flow in Settings → Privacy.
 *
 * Returns the per-rule pass/fail state and a derived strength bucket
 * (weak/fair/good/strong) that maps onto a 4-segment meter. `passwordFieldSchema`
 * is the submit-time half of the same rule.
 *
 * ─── These rules mirror the server, deliberately and exactly ──────────────────
 * The authority is `PasswordConstraintValidator` in revquix-backend-server, reached
 * through `@ValidPassword`. Anything looser here is a mystery 400 at the end of a
 * multi-step flow; anything stricter is a password the user cannot set and cannot
 * understand why. Before auth-hardening Phase 2 this console had three drifted
 * copies of the rule and every one of them disagreed with the server:
 *
 *   - `register-form.tsx` checked four rules and omitted the special character the
 *     server has always required, so a valid-looking signup 400'd.
 *   - `forgot-password-form.tsx` tested `/[^A-Za-z0-9]/` for the special character -
 *     any non-alphanumeric - while the server accepts a *closed set*, so
 *     `Passw0rd~` passed here and failed there.
 *   - `privacy-tab.tsx` checked length alone, matching the server's own gap, which
 *     is what this phase closes.
 *
 * None of the three checked the 128-character ceiling or the server's ban on
 * leading and trailing whitespace.
 *
 * This file is a deliberate mirror of the same module in `revquix-web`. The two
 * repos deploy independently, so the duplication is the cost of not having a shared
 * package; keep them in step.
 */

"use client"

import { useMemo } from "react"
import { z } from "zod"

export interface PasswordRule {
  id: string
  label: string
  test: (value: string) => boolean
}

export interface PasswordRuleResult extends PasswordRule {
  met: boolean
}

export type PasswordStrengthTone = "weak" | "fair" | "good" | "strong"

export interface PasswordStrength {
  /** 0–4 - number of meter segments to fill. */
  score: number
  label: string
  tone: PasswordStrengthTone
}

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/**
 * The exact special-character set the server accepts. Kept as a character class
 * rather than "any non-alphanumeric" because the server's set is closed: `~`, a
 * backtick, a backslash and a space are all rejected there.
 */
export const PASSWORD_SPECIAL_PATTERN = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/

/** Leading or trailing whitespace - rejected by the server, so rejected here. */
const HAS_EDGE_WHITESPACE = /^\s|\s$/

/**
 * The five rules the user can tick off. Every surface that sets a password shows
 * all five; there is no subset, because the server enforces all five everywhere.
 *
 * The ceiling and the whitespace ban are deliberately not here - they are things to
 * avoid rather than goals to reach, and a permanently-ticked "at most 128
 * characters" item is noise. They live in `passwordFieldSchema` and surface as a
 * field error, which is how the server reports them too.
 */
export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "uppercase", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lowercase", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character",
    test: (v) => PASSWORD_SPECIAL_PATTERN.test(v),
  },
]

/**
 * Submit-time validation for a new-password field. Message wording matches the
 * server's so the same problem reads the same way whichever side reports it.
 */
export const passwordFieldSchema = z
  .string()
  .min(1, "Password is required")
  .min(PASSWORD_MIN_LENGTH, `Must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .refine((v) => !HAS_EDGE_WHITESPACE.test(v), {
    message: "Must not start or end with a space",
  })
  .refine((v) => /[A-Z]/.test(v), {
    message: "Must contain at least one uppercase letter",
  })
  .refine((v) => /[a-z]/.test(v), {
    message: "Must contain at least one lowercase letter",
  })
  .refine((v) => /\d/.test(v), { message: "Must contain at least one number" })
  .refine((v) => PASSWORD_SPECIAL_PATTERN.test(v), {
    message: "Must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
  })

const STRENGTH_BUCKETS: ReadonlyArray<{
  min: number
  label: string
  tone: PasswordStrengthTone
}> = [
  { min: 0, label: "Too weak", tone: "weak" },
  { min: 1, label: "Weak", tone: "weak" },
  { min: 2, label: "Fair", tone: "fair" },
  { min: 3, label: "Good", tone: "good" },
  { min: 4, label: "Strong", tone: "strong" },
]

interface UsePasswordRulesReturn {
  rules: ReadonlyArray<PasswordRuleResult>
  strength: PasswordStrength
  /** True when every rule is satisfied. */
  allMet: boolean
}

export function usePasswordRules(password: string): UsePasswordRulesReturn {
  return useMemo(() => {
    const rules = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }))

    // Score is normalised to a 0–4 meter regardless of how many rules are checked.
    const passedCount = rules.filter((r) => r.met).length
    const meterScore = Math.round((passedCount / PASSWORD_RULES.length) * 4)

    const bucket =
      [...STRENGTH_BUCKETS].reverse().find((b) => meterScore >= b.min) ?? STRENGTH_BUCKETS[0]

    return {
      rules,
      strength: { score: meterScore, label: bucket.label, tone: bucket.tone },
      allMet: passedCount === PASSWORD_RULES.length,
    }
  }, [password])
}
