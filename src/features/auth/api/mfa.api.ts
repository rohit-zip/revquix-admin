/**
 * Two-factor authentication endpoints.
 *
 * Split from `auth.api.ts` because the challenge half is reached by a caller who is NOT signed in —
 * it exists to complete a sign-in — while the management half requires a session. Keeping them in
 * one file next to each other makes that boundary easy to see and hard to blur.
 */

import {apiClient} from "@/lib/axios"
import type {
  AuthenticatorAppId,
  ChallengeVerifyRequest,
  ChallengeVerifyResponse,
  EnrollInitiateRequest,
  EnrollInitiateResponse,
  ForcedEnrollConfirmResponse,
  MfaStatusResponse,
  MfaVerificationRequest,
  RecoveryCodesResponse,
} from "./mfa.types"

// ─── Management (Bearer required) ─────────────────────────────────────────────

export const getMfaStatus = (): Promise<MfaStatusResponse> =>
  apiClient.get<MfaStatusResponse>("/auth/mfa/status").then((r) => r.data)

/**
 * Emails a re-authentication code. Password-less accounts only — an account with a password
 * re-enters that instead, and the server refuses this call for them.
 */
export const sendMfaEnrolmentCode = (): Promise<{expiresAt: string}> =>
  apiClient.post<{expiresAt: string}>("/auth/mfa/enroll/send-code").then((r) => r.data)

export const beginMfaEnrolment = (
  data: EnrollInitiateRequest,
): Promise<EnrollInitiateResponse> =>
  apiClient.post<EnrollInitiateResponse>("/auth/mfa/enroll/initiate", data).then((r) => r.data)

/** Confirms with a code from the freshly-scanned app, and returns the recovery codes once. */
export const confirmMfaEnrolment = (code: string): Promise<RecoveryCodesResponse> =>
  apiClient.post<RecoveryCodesResponse>("/auth/mfa/enroll/confirm", {code}).then((r) => r.data)

export const disableMfa = (data: MfaVerificationRequest): Promise<void> =>
  apiClient.post("/auth/mfa/disable", data).then(() => undefined)

export const regenerateRecoveryCodes = (
  data: MfaVerificationRequest,
): Promise<RecoveryCodesResponse> =>
  apiClient
    .post<RecoveryCodesResponse>("/auth/mfa/recovery-codes/regenerate", data)
    .then((r) => r.data)

// ─── Challenge (no session — that is the point) ───────────────────────────────

/**
 * Completes a sign-in that is waiting on a second factor.
 *
 * Send `code` or `recoveryCode`; the server takes either. Deliberately one endpoint rather than
 * two, so a single rate-limit bucket keyed on the `mfaToken` covers both doors.
 */
export const verifyMfaChallenge = (
  data: ChallengeVerifyRequest,
): Promise<ChallengeVerifyResponse> =>
  apiClient.post<ChallengeVerifyResponse>("/auth/mfa/challenge/verify", data).then((r) => r.data)

// ─── Forced enrolment (Phase 6) — no session, authorised by the mfaToken ──────

export const beginForcedEnrolment = (mfaToken: string): Promise<EnrollInitiateResponse> =>
  apiClient
    .post<EnrollInitiateResponse>("/auth/mfa/challenge/enroll/initiate", { mfaToken })
    .then((r) => r.data)

export const confirmForcedEnrolment = (
  mfaToken: string,
  code: string,
  authenticatorApp?: AuthenticatorAppId,
): Promise<ForcedEnrollConfirmResponse> =>
  apiClient
    .post<ForcedEnrollConfirmResponse>("/auth/mfa/challenge/enroll/confirm", {
      mfaToken,
      code,
      authenticatorApp,
    })
    .then((r) => r.data)
