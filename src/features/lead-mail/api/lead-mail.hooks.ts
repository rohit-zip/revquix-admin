"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getLeadMailCampaign,
  listLeadMailCampaigns,
  parseLeadMailExcel,
  previewLeadMail,
  searchLeadMailRecipients,
  sendLeadMail,
  testSendLeadMail,
} from "./lead-mail.api"
import type {
  LeadMailPreviewRequest,
  LeadMailSendRequest,
  LeadMailTestSendRequest,
} from "./lead-mail.types"

export const leadMailKeys = {
  all: ["lead-mail"] as const,
  campaignList: (page: number, size: number) => ["lead-mail", "campaigns", page, size] as const,
  campaignDetail: (id: string) => ["lead-mail", "campaigns", "detail", id] as const,
  recipientSearch: (q: string) => ["lead-mail", "search-recipients", q] as const,
}

/** Manual recipient-entry autocomplete — debounced by the caller before enabling. */
export function useLeadMailRecipientSearch(query: string) {
  return useQuery({
    queryKey: leadMailKeys.recipientSearch(query),
    queryFn: () => searchLeadMailRecipients(query),
    enabled: query.trim().length >= 2,
  })
}

export function useParseLeadMailExcel() {
  return useMutation<Awaited<ReturnType<typeof parseLeadMailExcel>>, ApiError | NetworkError, File>({
    mutationFn: (file) => parseLeadMailExcel(file),
    onError: (err) => showErrorToast(err),
  })
}

export function usePreviewLeadMail() {
  return useMutation<
    Awaited<ReturnType<typeof previewLeadMail>>,
    ApiError | NetworkError,
    LeadMailPreviewRequest
  >({
    mutationFn: (request) => previewLeadMail(request),
    onError: (err) => showErrorToast(err),
  })
}

export function useTestSendLeadMail() {
  return useMutation<void, ApiError | NetworkError, LeadMailTestSendRequest>({
    mutationFn: (request) => testSendLeadMail(request),
    onSuccess: () => showSuccessToast("Test email sent"),
    onError: (err) => showErrorToast(err),
  })
}

export function useSendLeadMail() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof sendLeadMail>>,
    ApiError | NetworkError,
    LeadMailSendRequest
  >({
    mutationFn: (request) => sendLeadMail(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast(`Campaign sent to ${data.recipientCount} recipient(s)`)
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useLeadMailCampaign(campaignId: string, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: leadMailKeys.campaignDetail(campaignId),
    queryFn: () => getLeadMailCampaign(campaignId),
    enabled: !!campaignId,
    refetchInterval: options?.refetchInterval,
  })
}

export function useLeadMailCampaignList(page: number, size: number) {
  return useQuery({
    queryKey: leadMailKeys.campaignList(page, size),
    queryFn: () => listLeadMailCampaigns(page, size),
  })
}
