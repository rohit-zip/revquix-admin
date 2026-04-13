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

export interface LoginResponse {
  userId: string
  email: string
  username: string | null
  name: string | null
  accessToken: string
  expiresIn: number
  tokenType: string
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

export type OtpPurpose = "REGISTER" | "PASSWORD_RESET"

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


