"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getContactQueries,
  getContactQueryById,
  replyToContactQuery,
  updateContactNote,
  updateContactStatus,
} from "./contact.api"
import type {
  ContactInquiryType,
  ContactNoteRequest,
  ContactQueryStatus,
  ContactReplyRequest,
  ContactStatusUpdateRequest,
} from "./contact.types"

export const contactQueryKeys = {
  all: ["contact-queries"] as const,
  list: (
    page: number,
    size: number,
    status?: ContactQueryStatus,
    inquiryType?: ContactInquiryType,
    q?: string,
  ) => ["contact-queries", "list", page, size, status, inquiryType, q] as const,
  detail: (id: string) => ["contact-queries", "detail", id] as const,
}

export function useContactQueriesList(
  page: number,
  size: number,
  status?: ContactQueryStatus,
  inquiryType?: ContactInquiryType,
  q?: string,
) {
  return useQuery({
    queryKey: contactQueryKeys.list(page, size, status, inquiryType, q),
    queryFn: () => getContactQueries(page, size, status, inquiryType, q),
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.detail(data.contactQueryId) })
      showSuccessToast("Reply sent")
    },
    onError: (err) => showErrorToast(err),
  })
}
