"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { ContactQueryFilters } from "./contact.api"
import {
  getContactQueries,
  getSupportSlaSummary,
  getContactQueryById,
  replyToContactQuery,
  updateContactNote,
  updateContactStatus,
} from "./contact.api"
import type {
  ContactNoteRequest,
  ContactReplyRequest,
  ContactStatusUpdateRequest,
} from "./contact.types"

export const contactQueryKeys = {
  all: ["contact-queries"] as const,
  list: (filters: ContactQueryFilters) =>
    [
      "contact-queries",
      "list",
      filters.page,
      filters.size,
      filters.status,
      filters.inquiryType,
      filters.awaitingParty,
      filters.source,
      filters.q,
    ] as const,
  detail: (id: string) => ["contact-queries", "detail", id] as const,
}

export function useContactQueriesList(filters: ContactQueryFilters) {
  return useQuery({
    queryKey: contactQueryKeys.list(filters),
    queryFn: () => getContactQueries(filters),
  })
}

export function useContactQueryDetail(contactQueryId: string) {
  return useQuery({
    queryKey: contactQueryKeys.detail(contactQueryId),
    queryFn: () => getContactQueryById(contactQueryId),
    enabled: !!contactQueryId,
  })
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateContactStatus>>,
    ApiError | NetworkError,
    { contactQueryId: string; request: ContactStatusUpdateRequest }
  >({
    mutationFn: ({ contactQueryId, request }) => updateContactStatus(contactQueryId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all })
      queryClient.setQueryData(contactQueryKeys.detail(data.contactQueryId), data)
      showSuccessToast("Status updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUpdateContactNote() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateContactNote>>,
    ApiError | NetworkError,
    { contactQueryId: string; request: ContactNoteRequest }
  >({
    mutationFn: ({ contactQueryId, request }) => updateContactNote(contactQueryId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(contactQueryKeys.detail(data.contactQueryId), data)
      showSuccessToast("Internal note saved")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useReplyToContactQuery() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof replyToContactQuery>>,
    ApiError | NetworkError,
    { contactQueryId: string; request: ContactReplyRequest }
  >({
    mutationFn: ({ contactQueryId, request }) => replyToContactQuery(contactQueryId, request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.detail(data.contactQueryId) })
      // "Sent" is the wrong word for an internal note, and it is wrong in the direction that
      // matters: the whole point of the note is that it did NOT go to the member, and a toast
      // saying otherwise is the one place staff would look to confirm that.
      showSuccessToast(variables.request.internalNote ? "Internal note saved" : "Reply sent")
    },
    onError: (err) => showErrorToast(err),
  })
}

/**
 * The first-response report.
 *
 * A minute of staleness on a 30-day median is invisible, and this sits above a list the operator
 * refetches constantly — so it gets its own long `staleTime` rather than riding the list's.
 */
export function useSupportSlaSummary(days = 30, targetHours = 24) {
  return useQuery({
    queryKey: ["contact-queries", "sla", days, targetHours],
    queryFn: () => getSupportSlaSummary(days, targetHours),
    staleTime: 5 * 60_000,
  })
}
