/** API calls for PlatformMeetOAuthController. */

import { apiClient } from "@/lib/axios"
import type { MeetRoundTripResult, PlatformMeetAccount, PlatformMeetStatus } from "./google-meet.types"

const BASE = "/admin/google-meet"

export const getMeetAccounts = (): Promise<PlatformMeetAccount[]> =>
  apiClient.get<PlatformMeetAccount[]>(`${BASE}/accounts`).then((r) => r.data)

export const getMeetStatus = (): Promise<PlatformMeetStatus> =>
  apiClient.get<PlatformMeetStatus>(`${BASE}/status`).then((r) => r.data)

/** Returns the Google consent URL; the caller navigates the operator to it. */
export const startMeetAuthorization = (): Promise<{ authorizationUrl: string }> =>
  apiClient.post<{ authorizationUrl: string }>(`${BASE}/authorize`).then((r) => r.data)

/**
 * POST, not GET, and deliberately so: every run mints a real space that CANNOT be deleted and
 * spends one of the account's ten-per-minute create budget.
 */
export const runMeetRoundTrip = (): Promise<MeetRoundTripResult> =>
  apiClient.post<MeetRoundTripResult>(`${BASE}/test`).then((r) => r.data)

export const promoteMeetAccount = (accountId: string): Promise<{ message: string }> =>
  apiClient.post<{ message: string }>(`${BASE}/accounts/${accountId}/promote`).then((r) => r.data)

export const disconnectMeetAccount = (
  accountId: string,
): Promise<{ revokedAtGoogle: boolean; message: string }> =>
  apiClient
    .delete<{ revokedAtGoogle: boolean; message: string }>(`${BASE}/accounts/${accountId}`)
    .then((r) => r.data)
