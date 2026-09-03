// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  userId: string
  message: string
}

export type RegisterFormValues = RegisterRequest

// ─── Login ────────────────────────────────────────────────────────────────────

/** Shape the form captures — password maps to `credential` in the API payload */
export interface LoginFormValues {
  identifier: string
  password: string
}

/** Wire shape sent to POST /auth/login */
export interface LoginRequest {
  identifier: string
  credentialType: "PASSWORD"
  credential: string
}

/**
 * The response every sign-in path returns — and since auth-hardening Phase 5 it covers two
 * outcomes, not one.
 *
 * Branch on `status`, never on `accessToken` being absent. The discriminator is present on every
 * response including `AUTHENTICATED` ones and including `/auth/refresh`.
 */
export interface LoginResponse {
  status?: "AUTHENTICATED" | "MFA_REQUIRED"
  userId: string
  email: string
  username: string | null
  name: string | null
  /** Empty on an `MFA_REQUIRED` response — there is no session yet. */
  accessToken: string
  expiresIn: number
  tokenType: string

  /** Single-use, five-minute handle to the parked sign-in. Only on `MFA_REQUIRED`. */
  mfaToken?: string | null
  /** `RECOVERY_CODE` is absent once the account's codes run out. */
  mfaMethods?: MfaMethod[] | null
  /** Phase 6: this admin must set up two-factor auth. */
  mfaEnrollmentRequired?: boolean
}

export type MfaMethod = "TOTP" | "RECOVERY_CODE"

/**
 * Narrows a sign-in response to the "one more step" case.
 *
 * A shared guard rather than an inline check per hook: two hooks consume these, and the point of a
 * discriminator is defeated if each spells the check slightly differently.
 */
export function isMfaRequired(
  response: LoginResponse,
): response is LoginResponse & { mfaToken: string } {
  return response.status === "MFA_REQUIRED" && Boolean(response.mfaToken)
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export interface VerifyEmailRequest {
  userId: string
  otp: string
}

export interface VerifyEmailResponse {
  message: string
}

// ─── Resend OTP ────────────────────────────────────────────────────────────────

export type OtpPurpose = "REGISTER" | "PASSWORD_RESET" | "EMAIL_OTP_REGISTER" | "EMAIL_OTP_LOGIN"

export interface ResendOtpRequest {
  userId: string
  purpose: OtpPurpose
}

export interface ResendOtpResponse {
  userId: string
  email: string
  message: string
  otpExpiresInSeconds: number
  nextResendAvailableInSeconds: number
}

// ─── Email OTP ────────────────────────────────────────────────────────────────

export interface EmailOtpInitiateRequest {
  email: string
}

export interface EmailOtpInitiateResponse {
  /** true = existing user signing in, false = new user registering */
  emailExists: boolean
  message: string
  /** How long (seconds) the OTP remains valid */
  otpExpiresInSeconds: number
  /** userId for this OTP session — pass to /auth/resend-otp instead of re-calling initiate */
  userId: string
}

export interface EmailOtpVerifyRequest {
  email: string
  otp: string
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

/** Step 1 — POST /auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  otpExpiresInSeconds: number
}

/** Step 2 — POST /auth/verify-password-reset */
export interface VerifyPasswordResetOtpRequest {
  email: string
  otp: string
}

export interface VerifyPasswordResetOtpResponse {
  resetToken: string
  expiresInSeconds: number
  message: string
}

/** Step 3 — POST /auth/reset-password */
export interface ResetPasswordRequest {
  resetToken: string
  newPassword: string
}

export interface ResetPasswordResponse {
  userId: string
  email: string
  message: string
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Refresh token response — same shape as LoginResponse
 * The refresh token itself arrives as an httpOnly cookie set by backend
 */
export type RefreshTokenResponse = LoginResponse


