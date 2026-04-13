import { apiClient } from "@/lib/axios"
import type {
  EmailOtpInitiateRequest,
  EmailOtpInitiateResponse,
  EmailOtpVerifyRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginFormValues,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailRequest,
  VerifyPasswordResetOtpRequest,
  VerifyPasswordResetOtpResponse,
} from "./auth.types"

export const registerUser = (data: RegisterRequest): Promise<RegisterResponse> =>
  apiClient.post<RegisterResponse>("/auth/register", data).then((r) => r.data)

// Transforms form values into the wire shape the backend expects:
//   password  → credential
//   (always)  → credentialType: "PASSWORD"
export const loginUser = (data: LoginFormValues): Promise<LoginResponse> =>
  apiClient
    .post<LoginResponse>("/auth/login", {
      identifier: data.identifier,
      credentialType: "PASSWORD",
      credential: data.password,
    })
    .then((r) => r.data)

// Calls the refresh endpoint to restore session from httpOnly refresh token cookie
export const refreshToken = (): Promise<RefreshTokenResponse> =>
  apiClient
    .post<RefreshTokenResponse>("/auth/refresh")
    .then((r) => r.data)

// Called from /auth/callback after the backend redirects with ?code=UUID.
// The backend validates the one-time code, deletes it from Redis (single-use),
// sets the HttpOnly refresh token cookie, and returns a LoginResponse identical
// to POST /auth/login — so setCredentials() works unchanged.
export const exchangeOAuthCode = (code: string): Promise<LoginResponse> =>
  apiClient
    .get<LoginResponse>("/auth/oauth2/exchange", { params: { code } })
    .then((r) => r.data)

export const verifyEmail = (data: VerifyEmailRequest): Promise<LoginResponse> =>
  apiClient.post<LoginResponse>("/auth/verify-email", data).then((r) => r.data)

export const resendOtp = (data: ResendOtpRequest): Promise<ResendOtpResponse> =>
  apiClient.post<ResendOtpResponse>("/auth/resend-otp", data).then((r) => r.data)

// ─── Email OTP (passwordless) ─────────────────────────────────────────────────

/**
 * Step 1 – Sends a one-time code to the given email address.
 * Works for both new and existing accounts (emailExists distinguishes them).
 */
export const initiateEmailOtp = (
  data: EmailOtpInitiateRequest,
): Promise<EmailOtpInitiateResponse> =>
  apiClient
    .post<EmailOtpInitiateResponse>("/auth/email-otp/initiate", data)
    .then((r) => r.data)

/**
 * Step 2 – Verifies the OTP and returns a full LoginResponse (access token +
 * user info). The refresh token arrives as an httpOnly cookie from the backend.
 */
export const verifyEmailOtp = (data: EmailOtpVerifyRequest): Promise<LoginResponse> =>
  apiClient.post<LoginResponse>("/auth/email-otp/verify", data).then((r) => r.data)

export const logoutUser = (): Promise<void> =>
  apiClient.post<void>("/auth/logout").then(() => undefined)

// ─── Forgot Password (3-step flow) ────────────────────────────────────────────

/** Step 1 — Sends a 6-digit OTP to the given email. Always returns 202. */
export const forgotPassword = (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> =>
  apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", data).then((r) => r.data)

/** Step 2 — Verifies the OTP; returns a short-lived resetToken (UUID). */
export const verifyPasswordResetOtp = (
  data: VerifyPasswordResetOtpRequest,
): Promise<VerifyPasswordResetOtpResponse> =>
  apiClient
    .post<VerifyPasswordResetOtpResponse>("/auth/verify-password-reset", data)
    .then((r) => r.data)

/** Step 3 — Sets the new password and revokes all existing sessions. */
export const resetPassword = (data: ResetPasswordRequest): Promise<ResetPasswordResponse> =>
  apiClient.post<ResetPasswordResponse>("/auth/reset-password", data).then((r) => r.data)

