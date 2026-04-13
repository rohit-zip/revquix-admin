/**
 * ─── PASSWORD HOOKS ───────────────────────────────────────────────────────────
 *
 * React Query mutation hooks for the change/add-password flow.
 */

import { useMutation } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  applyPasswordChange,
  initiatePasswordChange,
  verifyPasswordChangeOtp,
} from "./password.api"
import type {
  ChangePasswordApplyRequest,
  ChangePasswordVerifyOtpRequest,
} from "./password.types"

/**
 * Step 1 — Initiate mutation.
 * Calls POST /user/me/password/initiate.
 * Does NOT show a success toast — the UI handles the branching based on the response.
 */
export function useInitiatePasswordChange(
  onSuccess?: (requiresOtp: boolean, changeToken: string | null | undefined, otpExpiresInSeconds: number | null | undefined) => void
) {
  return useMutation({
    mutationFn: initiatePasswordChange,
    retry: false,
    onSuccess: (data) => {
      onSuccess?.(data.requiresOtp, data.changeToken ?? null, data.otpExpiresInSeconds ?? null)
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Step 2 — Verify OTP mutation.
 * Calls POST /user/me/password/verify-otp.
 */
export function useVerifyPasswordChangeOtp(onSuccess?: (changeToken: string) => void) {
  return useMutation({
    mutationFn: (data: ChangePasswordVerifyOtpRequest) => verifyPasswordChangeOtp(data),
    retry: false,
    onSuccess: (data) => {
      onSuccess?.(data.changeToken)
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Step 3 — Apply password mutation.
 * Calls POST /user/me/password/apply.
 */
export function useApplyPasswordChange(onSuccess?: (message: string) => void) {
  return useMutation({
    mutationFn: (data: ChangePasswordApplyRequest) => applyPasswordChange(data),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(data.message)
      onSuccess?.(data.message)
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

