"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  disconnectMeetAccount,
  getMeetAccounts,
  getMeetStatus,
  promoteMeetAccount,
  runMeetRoundTrip,
  startMeetAuthorization,
} from "./google-meet.api"

export const googleMeetKeys = {
  accounts: ["google-meet", "accounts"] as const,
  status: ["google-meet", "status"] as const,
}

export function useMeetAccounts() {
  return useQuery({ queryKey: googleMeetKeys.accounts, queryFn: getMeetAccounts })
}

/**
 * The health banner's source.
 *
 * A separate, cheap query from the accounts table on purpose: this banner has to be correct even
 * when rendering the full table fails, because it is the thing an operator looks at during an
 * incident.
 */
export function useMeetStatus() {
  return useQuery({ queryKey: googleMeetKeys.status, queryFn: getMeetStatus })
}

/** Navigates the whole window to Google. The callback returns the operator to this page. */
export function useStartMeetAuthorization() {
  return useMutation({
    mutationFn: startMeetAuthorization,
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl
    },
    onError: (error: ApiError | NetworkError | Error) => showErrorToast(error),
  })
}

export function useRunMeetRoundTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runMeetRoundTrip,
    onSuccess: (result) => {
      // Deliberately not a success toast on `success === false`. The endpoint returns 200 for a
      // FAILED test - a verification tool that 500s tells an operator less than one that reports
      // which step broke - so the toast has to read the payload, not the status code.
      if (result.success) {
        showSuccessToast("Round trip passed - Revquix-hosted meetings are working.")
      } else {
        showErrorToast(
          new Error(result.failureMessage ?? "The round trip did not pass. See the steps below."),
        )
      }
      void queryClient.invalidateQueries({ queryKey: googleMeetKeys.accounts })
      void queryClient.invalidateQueries({ queryKey: googleMeetKeys.status })
    },
    onError: (error: ApiError | NetworkError | Error) => showErrorToast(error),
  })
}

export function usePromoteMeetAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: promoteMeetAccount,
    onSuccess: (data) => {
      showSuccessToast(data.message)
      void queryClient.invalidateQueries({ queryKey: googleMeetKeys.accounts })
      void queryClient.invalidateQueries({ queryKey: googleMeetKeys.status })
    },
    onError: (error: ApiError | NetworkError | Error) => showErrorToast(error),
  })
}

export function useDisconnectMeetAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectMeetAccount,
    onSuccess: (data) => {
      showSuccessToast(data.message)
      void queryClient.invalidateQueries({ queryKey: googleMeetKeys.accounts })
      void queryClient.invalidateQueries({ queryKey: googleMeetKeys.status })
    },
    onError: (error: ApiError | NetworkError | Error) => showErrorToast(error),
  })
}
