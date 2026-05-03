/**
 * ─── OFFER ORDER HOOKS ───────────────────────────────────────────────────────
 *
 * React Query hooks for AdminOfferOrderController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { GenericFilterRequest } from "@/core/filters/filter.types"
import type {
  AssignOfferReviewerRequest,
  CompleteOfferOrderRequest,
  OfferCancelOrderRequest,
} from "./offer-service.types"
import {
  adminAssignOfferReviewer,
  adminCancelOfferOrder,
  adminCompleteOfferOrder,
  adminDeleteDeliverable,
  adminGetOfferOrder,
  adminListOrderDeliverables,
  adminSearchOfferOrders,
  adminStartOfferOrderProgress,
  adminUploadDeliverable,
} from "./offer-order.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const offerOrderKeys = {
  search: (req: GenericFilterRequest, page: number, size: number) =>
    ["offer-orders", "search", req, page, size] as const,
  detail: (orderId: string) => ["offer-orders", "detail", orderId] as const,
  deliverables: (orderId: string) => ["offer-orders", "deliverables", orderId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminSearchOfferOrders(
  request: GenericFilterRequest,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: offerOrderKeys.search(request, page, size),
    queryFn: () => adminSearchOfferOrders(request, { page, size }),
  })
}

export function useAdminOfferOrderDetail(orderId: string) {
  return useQuery({
    queryKey: offerOrderKeys.detail(orderId),
    queryFn: () => adminGetOfferOrder(orderId),
    enabled: !!orderId,
  })
}

export function useAdminOrderDeliverables(orderId: string) {
  return useQuery({
    queryKey: offerOrderKeys.deliverables(orderId),
    queryFn: () => adminListOrderDeliverables(orderId),
    enabled: !!orderId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAdminStartOfferOrderProgress(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminStartOfferOrderProgress(orderId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Order moved to In Progress")
      qc.invalidateQueries({ queryKey: offerOrderKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: ["offer-orders", "search"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminCompleteOfferOrder(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request?: CompleteOfferOrderRequest) => adminCompleteOfferOrder(orderId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Order marked as Completed")
      qc.invalidateQueries({ queryKey: offerOrderKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: ["offer-orders", "search"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminAssignOfferReviewer(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: AssignOfferReviewerRequest) =>
      adminAssignOfferReviewer(orderId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Reviewer assigned")
      qc.invalidateQueries({ queryKey: offerOrderKeys.detail(orderId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminCancelOfferOrder(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request?: OfferCancelOrderRequest) => adminCancelOfferOrder(orderId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Order cancelled")
      qc.invalidateQueries({ queryKey: offerOrderKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: ["offer-orders", "search"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminUploadDeliverable(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, description }: { file: File; description?: string }) =>
      adminUploadDeliverable(orderId, file, description),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Deliverable uploaded")
      qc.invalidateQueries({ queryKey: offerOrderKeys.deliverables(orderId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminDeleteDeliverable(orderId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (deliverableId: string) => adminDeleteDeliverable(deliverableId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Deliverable deleted")
      qc.invalidateQueries({ queryKey: offerOrderKeys.deliverables(orderId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
