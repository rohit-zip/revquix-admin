/**
 * ─── PASSWORD API TYPES ───────────────────────────────────────────────────────
 *
 * TypeScript types for the change/add-password flow endpoints.
 */

// ─── Initiate ─────────────────────────────────────────────────────────────────

export interface ChangePasswordInitiateResponse {
  requiresOtp: boolean
  hasPassword: boolean
  /** Populated only when requiresOtp=false */
  changeToken?: string | null
  /** Populated only when requiresOtp=true — seconds until OTP expires */
  otpExpiresInSeconds?: number | null
  message: string
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export interface ChangePasswordVerifyOtpRequest {
  otp: string
}

export interface ChangePasswordVerifyOtpResponse {
  changeToken: string
  expiresInSeconds: number
  message: string
}

// ─── Apply ────────────────────────────────────────────────────────────────────

export interface ChangePasswordApplyRequest {
  changeToken: string
  /** Required only when the account already has a password (hasPassword=true) */
  currentPassword?: string | null
  newPassword: string
}

export interface ChangePasswordApplyResponse {
  message: string
}

