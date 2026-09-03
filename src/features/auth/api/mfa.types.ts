/**
 * Two-factor authentication — request and response shapes for `/api/v1/auth/mfa/**`.
 *
 * See `docs/AUTH_HARDENING_MASTER_PLAN.md` §4.7 for the endpoint table.
 */

import type {AuthenticatorAppId} from "@/features/auth/_shell/authenticator-apps"
import type {LoginResponse, MfaMethod} from "./auth.types"

// ─── Status ───────────────────────────────────────────────────────────────────

export interface MfaStatusResponse {
  /** True only for a confirmed enrolment. A half-finished one reads as false. */
  enabled: boolean
  confirmedAt: string | null
  /** Zero plus a lost phone is a support ticket, so the screen surfaces this. */
  recoveryCodesRemaining: number
  /**
   * Which app the member said they set up, or null.
   *
   * ⚠ **Self-reported.** TOTP carries no app identity, so this is what they told us at enrolment and
   * nothing verified it. Null for anyone who skipped the question or enrolled before V355.
   */
  authenticatorApp: AuthenticatorAppId | null
}

// ─── Enrolment ────────────────────────────────────────────────────────────────

/**
 * Re-authentication before enrolment. Send exactly one, depending on the account:
 * `password` where one is set, `otp` for an account that has none (Google, Magic Code).
 */
export interface EnrollInitiateRequest {
  password?: string
  otp?: string
}

export interface EnrollInitiateResponse {
  /** Render this as a QR code. Never sent to a server — the drawing happens in the browser. */
  otpauthUri: string
  /** The same secret, for anyone who cannot scan. Manual entry is a required fallback. */
  secret: string
  issuer: string
}

/** Returned once, at the end of enrolment, and never retrievable again. */
export interface RecoveryCodesResponse {
  recoveryCodes: string[]
}

// ─── Disable / regenerate ─────────────────────────────────────────────────────

/** Takes a code from the app OR an unused recovery code — never a password alone. */
export interface MfaVerificationRequest {
  code?: string
  recoveryCode?: string
}

// ─── Challenge ────────────────────────────────────────────────────────────────

export interface ChallengeVerifyRequest {
  mfaToken: string
  code?: string
  recoveryCode?: string
}

/** Completing a challenge returns the same envelope every other sign-in path returns. */
export type ChallengeVerifyResponse = LoginResponse

// ─── Forced enrolment (Phase 6) ───────────────────────────────────────────────

/**
 * An admin past their grace period has no session and no factor to present, so enrolment is
 * authorised by the same `mfaToken` that would otherwise carry a code.
 */
export interface ForcedEnrollConfirmResponse {
  login: LoginResponse
  recoveryCodes: string[]
}

export type {AuthenticatorAppId}
export type {MfaMethod}
