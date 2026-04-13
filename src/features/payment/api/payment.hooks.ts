/**
 * ─── PAYMENT HOOKS ────────────────────────────────────────────────────────────
 *
 * React Query hooks for PaymentController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getPendingPayments,
  getPaymentHistory,
  getPaymentStatus,
  getPaymentDetail,
  getAdminPaymentDetail,
  adminSearchPayments,
  searchWebhookLogs,
  getWebhookLogById,
  getMyWallet,
  getAllMentorWallets,
  getMentorWallet,
  updateMentorCommission,
  adminRefund,
  getRefundHistory,
  getRemainingRefundable,
} from "./payment.api"
import type { GenericFilterRequest } from "@/core/filters/filter.types"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import type { PaymentWebhookLogResponse } from "./payment.types"

export const paymentKeys = {
  pending: ["payments", "pending"] as const,
  history: ["payments", "history"] as const,
  detail: (id: string) => ["payments", "detail", id] as const,
  adminDetail: (id: string) => ["payments", "admin", "detail", id] as const,
  status: (orderId: string) => ["payments", "status", orderId] as const,
  adminSearch: (req: GenericFilterRequest, page: number, size: number) =>
    ["payments", "admin", "search", req, page, size] as const,
  webhookDetail: (id: number) => ["payments", "admin", "webhooks", id] as const,
  myWallet: ["wallets", "my"] as const,
  allWallets: ["wallets", "admin", "summary"] as const,
  mentorWallet: (id: string) => ["wallets", "admin", id] as const,
  refundHistory: (id: string) => ["payments", "admin", "refunds", id] as const,
  refundable: (id: string) => ["payments", "admin", "refundable", id] as const,
}

export function usePendingPayments() {
  return useQuery({
    queryKey: paymentKeys.pending,
    queryFn: getPendingPayments,
  })
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: paymentKeys.history,
    queryFn: getPaymentHistory,
  })
}

/** Fetch a single payment order by its ID */
export function usePaymentDetail(paymentOrderId: string) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentOrderId),
    queryFn: () => getPaymentDetail(paymentOrderId),
    enabled: !!paymentOrderId,
  })
}

/**
 * Poll payment status at a configurable interval.
 * Useful for page-reload recovery.
 */
export function usePaymentStatus(razorpayOrderId: string, pollInterval?: number) {
  return useQuery({
    queryKey: paymentKeys.status(razorpayOrderId),
    queryFn: () => getPaymentStatus(razorpayOrderId),
    enabled: !!razorpayOrderId,
    refetchInterval: pollInterval ?? false,
  })
}

/** Admin: search all payments with filters */
export function useAdminSearchPayments(
  request: GenericFilterRequest,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: paymentKeys.adminSearch(request, page, size),
    queryFn: () => adminSearchPayments(request, { page, size }),
  })
}

/** Admin: fetch a single payment order by ID (any user) */
export function useAdminPaymentDetail(paymentOrderId: string) {
  return useQuery({
    queryKey: paymentKeys.adminDetail(paymentOrderId),
    queryFn: () => getAdminPaymentDetail(paymentOrderId),
    enabled: !!paymentOrderId,
  })
}

// ─── Webhook Logs Filter Config ───────────────────────────────────────────────

export const WEBHOOK_LOGS_FILTER_CONFIG: FilterConfig = {
  filterFields: [
    {
      field: "eventType",
      label: "Event Type",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
      options: [
        { label: "Payment Captured", value: "payment.captured" },
        { label: "Payment Failed", value: "payment.failed" },
        { label: "Payment Authorized", value: "payment.authorized" },
        { label: "Refund Created", value: "refund.created" },
        { label: "Refund Processed", value: "refund.processed" },
      ],
    },
    {
      field: "isProcessed",
      label: "Processed",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    {
      field: "eventId",
      label: "Event ID",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
    },
    {
      field: "razorpayOrderId",
      label: "Razorpay Order ID",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
    },
    {
      field: "razorpayPaymentId",
      label: "Razorpay Payment ID",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
    },
    {
      field: "processingError",
      label: "Has Processing Error",
      type: "STRING",
      operators: ["IS_NULL", "IS_NOT_NULL"],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Received At", type: "INSTANT" },
    { field: "updatedAt", label: "Updated At", type: "INSTANT" },
    { field: "attemptCount", label: "Attempt Count", type: "INTEGER" },
  ],
  sortFields: [
    { field: "createdAt", label: "Received At" },
    { field: "updatedAt", label: "Updated At" },
    { field: "eventType", label: "Event Type" },
    { field: "attemptCount", label: "Attempts" },
  ],
  joinFilterFields: [],
  searchableFields: ["eventId", "eventType", "razorpayOrderId", "razorpayPaymentId"],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

/** Admin: search webhook logs with generic filters */
export function useWebhookLogsSearch() {
  return useGenericSearch<PaymentWebhookLogResponse>({
    queryKey: "admin-webhook-logs",
    searchFn: searchWebhookLogs,
    config: WEBHOOK_LOGS_FILTER_CONFIG,
  })
}

/** Admin: fetch a single webhook log by ID */
export function useWebhookLogById(id: number) {
  return useQuery({
    queryKey: paymentKeys.webhookDetail(id),
    queryFn: () => getWebhookLogById(id),
    enabled: !!id,
  })
}

// ─── Mentor Wallets ───────────────────────────────────────────────────────────

/** Mentor: get own wallet summary */
export function useMyWallet() {
  return useQuery({
    queryKey: paymentKeys.myWallet,
    queryFn: getMyWallet,
  })
}

/** Admin: get all mentor wallet summaries */
export function useAllMentorWallets() {
  return useQuery({
    queryKey: paymentKeys.allWallets,
    queryFn: getAllMentorWallets,
  })
}

/** Admin: get wallet summary for a specific mentor */
export function useMentorWallet(mentorUserId: string) {
  return useQuery({
    queryKey: paymentKeys.mentorWallet(mentorUserId),
    queryFn: () => getMentorWallet(mentorUserId),
    enabled: !!mentorUserId,
  })
}

/** Admin: update per-mentor commission percentage */
export function useUpdateMentorCommission(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      mentorProfileId,
      commissionPercentage,
    }: {
      mentorProfileId: string
      commissionPercentage: number | null
    }) => updateMentorCommission(mentorProfileId, commissionPercentage),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Commission updated successfully")
      qc.invalidateQueries({ queryKey: paymentKeys.allWallets })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Admin Refund ─────────────────────────────────────────────────────────────

/** Admin: initiate manual refund */
export function useAdminRefund(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      paymentOrderId,
      amountMinor,
      reason,
    }: {
      paymentOrderId: string
      amountMinor: number
      reason: string
    }) => adminRefund(paymentOrderId, amountMinor, reason),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Refund initiated successfully")
      qc.invalidateQueries({ queryKey: paymentKeys.history })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/** Admin: get refund history for a payment order */
export function useRefundHistory(paymentOrderId: string) {
  return useQuery({
    queryKey: paymentKeys.refundHistory(paymentOrderId),
    queryFn: () => getRefundHistory(paymentOrderId),
    enabled: !!paymentOrderId,
  })
}

/** Admin: get remaining refundable amount */
export function useRemainingRefundable(paymentOrderId: string) {
  return useQuery({
    queryKey: paymentKeys.refundable(paymentOrderId),
    queryFn: () => getRemainingRefundable(paymentOrderId),
    enabled: !!paymentOrderId,
  })
}


