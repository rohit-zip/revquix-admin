/**
 * ─── CUSTOM QUOTE HOOKS ──────────────────────────────────────────────────────
 *
 * React Query hooks for the AdminCustomQuoteController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { CreateQuoteRequest, UpdateQuoteRequest } from "./offer-service.types"
import {
  adminCancelQuote,
  adminCreateQuote,
  adminGetQuote,
  adminSendQuote,
  adminUpdateQuote,
} from "./quote.api"

export const quoteKeys = {
  detail: (orderId: string) => ["custom-quotes", "detail", orderId] as const,
  search: () => ["custom-quotes", "search"] as const,
}

export function useAdminQuoteDetail(orderId: string) {
  return useQuery({
    queryKey: quoteKeys.detail(orderId),
    queryFn: () => adminGetQuote(orderId),
    enabled: !!orderId,
  })
}

export function useAdminCreateQuote(onSuccess?: (orderId: string) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateQuoteRequest) => adminCreateQuote(request),
    retry: false,
    onSuccess: (res) => {
      showSuccessToast("Quote created")
      qc.invalidateQueries({ queryKey: quoteKeys.search() })
      onSuccess?.(res.orderId)
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminUpdateQuote(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateQuoteRequest) => adminUpdateQuote(orderId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Quote updated")
      qc.invalidateQueries({ queryKey: quoteKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: quoteKeys.search() })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminSendQuote(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminSendQuote(orderId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Quote sent to recipient")
      qc.invalidateQueries({ queryKey: quoteKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: quoteKeys.search() })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminCancelQuote(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason?: string) => adminCancelQuote(orderId, { reason }),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Quote cancelled")
      qc.invalidateQueries({ queryKey: quoteKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: quoteKeys.search() })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
