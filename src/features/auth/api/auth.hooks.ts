import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { UseFormSetError } from "react-hook-form"

import { useAppDispatch } from "@/hooks/useRedux"
import { clearCredentials, setCredentials } from "@/core/slices/auth.slice"
import {
  clearUserProfile,
  fetchUserProfileFailed,
  fetchUserProfileStart,
  setUserProfile,
} from "@/core/slices/userProfile.slice"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import { clearSessionCookie, setSessionCookie } from "@/lib/session-cookie"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { LoginFormValues, RegisterFormValues } from "./auth.types"
import { initiateEmailOtp, loginUser, logoutUser, registerUser, resendOtp, verifyEmail, verifyEmailOtp, forgotPassword, verifyPasswordResetOtp, resetPassword } from "./auth.api"
import { getCurrentUser } from "@/features/user/api/user.api"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

/**
 * Wraps the register API call with full error handling:
 *  - Field errors (Map<String,String>) → set directly on RHF fields via setError
 *  - String / list errors              → Sonner toast
 *
 * On success navigates to /auth/verify-email with userId + email as URL params.
 * No client-side state needed — params survive refresh and backend email
 * verification links (?userId=...&otp=...) work the same way.
 */
export function useRegister(setError: UseFormSetError<RegisterFormValues>) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const mutation = useMutation({
    mutationFn: registerUser,
    retry: false,
    onSuccess: (data, variables) => {
      showSuccessToast(data.message ?? "Account created! Please verify your email.")
      const from = new URLSearchParams(window.location.search).get("from")
      const verifyUrl = `/auth/verify-email?userId=${data.userId}&email=${encodeURIComponent(variables.email)}`
      setIsRedirecting(true)
      router.push(from ? `${verifyUrl}&from=${encodeURIComponent(from)}` : verifyUrl)
    },
    onError: (error: ApiError | NetworkError) => {
      setIsRedirecting(false)
      if ("isFieldError" in error && error.isFieldError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof RegisterFormValues, { type: "server", message })
        })
        return
      }
      showErrorToast(error)
    },
  })

  return { ...mutation, isRedirecting, isPending: mutation.isPending || isRedirecting }
}

/**
 * Wraps the login API call with full error handling:
 *  - Field errors (Map<String,String>) → set directly on RHF fields via setError
 *  - String / list errors              → Sonner toast
 *
 * On success stores the full LoginResponse in Redux (accessToken + user info)
 * and navigates to the app home. The refresh token arrives as an httpOnly cookie
 * set by the backend — no client-side handling needed.
 */
export function useLogin(setError: UseFormSetError<LoginFormValues>) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const mutation = useMutation({
    mutationFn: loginUser,
    retry: false,
    onSuccess: async (data) => {
      dispatch(setCredentials(data))
      setSessionCookie()

      try {
        dispatch(fetchUserProfileStart())
        const profile = await getCurrentUser()
        dispatch(setUserProfile(profile))
      } catch {
        dispatch(fetchUserProfileFailed("Failed to load profile"))
      }

      showSuccessToast(`Welcome back${data.name ? `, ${data.name}` : ""}!`)

      const from = new URLSearchParams(window.location.search).get("from")
      const destination =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : PATH_CONSTANTS.DASHBOARD

      setIsRedirecting(true)
      router.push(destination)
    },
    onError: (error: ApiError | NetworkError) => {
      setIsRedirecting(false)
      if ("isFieldError" in error && error.isFieldError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof LoginFormValues, { type: "server", message })
        })
        return
      }
      showErrorToast(error)
    },
  })

  return { ...mutation, isRedirecting, isPending: mutation.isPending || isRedirecting }
}

/**
 * Submits the 6-digit OTP + userId to verify the user's email address.
 * On success navigates to /auth/login so the user can sign in.
 */
export function useVerifyEmail() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const mutation = useMutation({
    mutationFn: verifyEmail,
    retry: false,
    onSuccess: async (data) => {
      dispatch(setCredentials(data))
      showSuccessToast("Email has been verified successfully!")
      setSessionCookie()

      try {
        dispatch(fetchUserProfileStart())
        const profile = await getCurrentUser()
        dispatch(setUserProfile(profile))
      } catch {
        dispatch(fetchUserProfileFailed("Failed to load profile"))
      }

      const from = new URLSearchParams(window.location.search).get("from")
      const destination =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : PATH_CONSTANTS.DASHBOARD

      setIsRedirecting(true)
      router.push(destination)
    },
    onError: (error: ApiError | NetworkError) => {
      setIsRedirecting(false)
      showErrorToast(error)
    },
  })

  return { ...mutation, isRedirecting, isPending: mutation.isPending || isRedirecting }
}

/**
 * Requests a new OTP for the given userId.
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: resendOtp,
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(data.message ?? "A new OTP has been sent to your email.")
    },
    onError: (error: ApiError | NetworkError) => {
      showErrorToast(error)
    },
  })
}

// ─── Email OTP (passwordless) ─────────────────────────────────────────────────

/**
 * Step 1 – Initiates passwordless email-OTP auth.
 * Callers receive the raw response so they can read emailExists + otpExpiresInSeconds.
 */
export function useInitiateEmailOtp() {
  return useMutation({
    mutationFn: initiateEmailOtp,
    retry: false,
    onError: (error: ApiError | NetworkError) => {
      showErrorToast(error)
    },
  })
}

/**
 * Step 2 – Verifies the OTP and signs the user in (same success flow as useLogin).
 * Works for both new registrations and existing users; the backend handles both.
 *
 * @param options.redirectTo  Override the post-login destination (default: DASHBOARD).
 */
export function useVerifyEmailOtp(options?: { redirectTo?: string }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const mutation = useMutation({
    mutationFn: verifyEmailOtp,
    retry: false,
    onSuccess: async (data) => {
      dispatch(setCredentials(data))
      setSessionCookie()

      try {
        dispatch(fetchUserProfileStart())
        const profile = await getCurrentUser()
        dispatch(setUserProfile(profile))
      } catch {
        dispatch(fetchUserProfileFailed("Failed to load profile"))
      }

      showSuccessToast(`Welcome${data.name ? `, ${data.name}` : ""}! You're now signed in.`)

      const explicitRedirect = options?.redirectTo
      const fromParam = new URLSearchParams(window.location.search).get("from")

      const destination =
        explicitRedirect ??
        (fromParam && fromParam.startsWith("/") && !fromParam.startsWith("//")
          ? fromParam
          : PATH_CONSTANTS.DASHBOARD)

      setIsRedirecting(true)
      router.push(destination)
    },
    onError: (error: ApiError | NetworkError) => {
      setIsRedirecting(false)
      showErrorToast(error)
    },
  })

  return { ...mutation, isRedirecting, isPending: mutation.isPending || isRedirecting }
}

/**
 * Calls POST /auth/logout to invalidate the server-side refresh token cookie,
 * then clears local Redux auth state + rv_session cookie regardless of the
 * API result (fail-safe: user is always signed out on the client).
 */
export function useLogout() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  return useMutation({
    mutationFn: logoutUser,
    retry: false,
    onSuccess: () => {
      dispatch(clearCredentials())
      dispatch(clearUserProfile())
      clearSessionCookie()
      showSuccessToast("You have been signed out successfully.")
      router.replace(PATH_CONSTANTS.AUTH_LOGIN)
    },
    onError: (error: ApiError | NetworkError) => {
      dispatch(clearCredentials())
      dispatch(clearUserProfile())
      clearSessionCookie()
      showErrorToast(error)
      router.replace(PATH_CONSTANTS.HOME)
    },
  })
}

// ─── Forgot Password (3-step flow) ────────────────────────────────────────────

/**
 * Step 1 — Initiates password reset by sending an OTP to the user's email.
 * Always succeeds (202) regardless of whether the email is registered,
 * to prevent email enumeration attacks.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
    retry: false,
    onError: (error: ApiError | NetworkError) => {
      showErrorToast(error)
    },
  })
}

/**
 * Step 2 — Verifies the 6-digit OTP and returns a short-lived resetToken.
 */
export function useVerifyPasswordResetOtp() {
  return useMutation({
    mutationFn: verifyPasswordResetOtp,
    retry: false,
    onError: (error: ApiError | NetworkError) => {
      showErrorToast(error)
    },
  })
}

/**
 * Step 3 — Finalises the password reset. On success all sessions are revoked
 * and the user is redirected to the login page.
 */
export function useResetPassword() {
  const router = useRouter()

  return useMutation({
    mutationFn: resetPassword,
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(data.message ?? "Password reset successfully! Please log in with your new password.")
      router.push(PATH_CONSTANTS.AUTH_LOGIN)
    },
    onError: (error: ApiError | NetworkError) => {
      showErrorToast(error)
    },
  })
}

