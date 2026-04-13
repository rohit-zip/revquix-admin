/**
 * ─── PASSWORD API ─────────────────────────────────────────────────────────────
 *
 * API functions for the change/add-password flow.
 * All endpoints are authenticated (JWT Bearer token added by the Axios interceptor).
 */

import { apiClient } from "@/lib/axios"
import type {
  ChangePasswordApplyRequest,
  ChangePasswordApplyResponse,
  ChangePasswordInitiateResponse,
  ChangePasswordVerifyOtpRequest,
  ChangePasswordVerifyOtpResponse,
} from "./password.types"

/**
 * Step 1 — Initiate the change/add-password flow.
 * The backend checks whether the request IP matches the registration IP.
 *  - Same IP → returns {requiresOtp: false, changeToken}
 *  - Different IP → sends OTP to email; returns {requiresOtp: true, otpExpiresInSeconds}
 */
export const initiatePasswordChange = (): Promise<ChangePasswordInitiateResponse> =>
  apiClient
    .post<ChangePasswordInitiateResponse>("/user/me/password/initiate")
    .then((r) => r.data)

/**
 * Step 2 (OTP path only) — Verify the 6-digit CHANGE_PASSWORD OTP.
 * Returns a short-lived changeToken to be used in the apply step.
 */
export const verifyPasswordChangeOtp = (
  data: ChangePasswordVerifyOtpRequest,
): Promise<ChangePasswordVerifyOtpResponse> =>
  apiClient
    .post<ChangePasswordVerifyOtpResponse>("/user/me/password/verify-otp", data)
    .then((r) => r.data)

/**
 * Step 3 — Apply the new password.
 * Validates the changeToken and optionally the current password, then persists.
 */
export const applyPasswordChange = (
  data: ChangePasswordApplyRequest,
): Promise<ChangePasswordApplyResponse> =>
  apiClient
    .post<ChangePasswordApplyResponse>("/user/me/password/apply", data)
    .then((r) => r.data)

