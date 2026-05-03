/**
 * ─── OFFER SERVICE HOOKS ─────────────────────────────────────────────────────
 *
 * React Query hooks for AdminOfferServiceController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { GenericFilterRequest } from "@/core/filters/filter.types"
import type {
  CreateOfferAddOnRequest,
  CreateOfferFormFieldRequest,
  CreateOfferPlanRequest,
  CreateOfferServiceRequest,
  CreatePlatformCouponRequest,
  UpdateOfferAddOnRequest,
  UpdateOfferFormFieldRequest,
  UpdateOfferPlanRequest,
  UpdateOfferServiceRequest,
} from "./offer-service.types"
import {
  adminCreateOfferAddOn,
  adminCreateOfferFormField,
  adminCreateOfferPlan,
  adminCreateOfferService,
  adminCreatePlatformCoupon,
  adminDeactivatePlatformCoupon,
  adminGetOfferService,
  adminListPlatformCoupons,
  adminSearchOfferServices,
  adminUpdateOfferAddOn,
  adminUpdateOfferFormField,
  adminUpdateOfferPlan,
  adminUpdateOfferService,
} from "./offer-service.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const offerServiceKeys = {
  search: (req: GenericFilterRequest, page: number, size: number) =>
    ["offer-services", "search", req, page, size] as const,
  detail: (serviceId: string) => ["offer-services", "detail", serviceId] as const,
  coupons: (page: number, size: number) => ["offer-services", "coupons", page, size] as const,
}

// ─── Service Queries ──────────────────────────────────────────────────────────

export function useAdminSearchOfferServices(
  request: GenericFilterRequest,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: offerServiceKeys.search(request, page, size),
    queryFn: () => adminSearchOfferServices(request, { page, size }),
  })
}

export function useAdminOfferServiceDetail(serviceId: string) {
  return useQuery({
    queryKey: offerServiceKeys.detail(serviceId),
    queryFn: () => adminGetOfferService(serviceId),
    enabled: !!serviceId,
  })
}

export function useAdminListPlatformCoupons(page: number, size: number) {
  return useQuery({
    queryKey: offerServiceKeys.coupons(page, size),
    queryFn: () => adminListPlatformCoupons({ page, size }),
  })
}

// ─── Service Mutations ────────────────────────────────────────────────────────

export function useAdminCreateOfferService(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateOfferServiceRequest) => adminCreateOfferService(request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Offer service created successfully")
      qc.invalidateQueries({ queryKey: ["offer-services", "search"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminUpdateOfferService(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateOfferServiceRequest) =>
      adminUpdateOfferService(serviceId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Offer service updated")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      qc.invalidateQueries({ queryKey: ["offer-services", "search"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Plan Mutations ───────────────────────────────────────────────────────────

export function useAdminCreateOfferPlan(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateOfferPlanRequest) => adminCreateOfferPlan(request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Plan created successfully")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminUpdateOfferPlan(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, request }: { planId: string; request: UpdateOfferPlanRequest }) =>
      adminUpdateOfferPlan(planId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Plan updated")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Add-On Mutations ─────────────────────────────────────────────────────────

export function useAdminCreateOfferAddOn(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateOfferAddOnRequest) => adminCreateOfferAddOn(request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Add-on created successfully")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminUpdateOfferAddOn(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ addOnId, request }: { addOnId: string; request: UpdateOfferAddOnRequest }) =>
      adminUpdateOfferAddOn(addOnId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Add-on updated")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Form Field Mutations ─────────────────────────────────────────────────────

export function useAdminCreateOfferFormField(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateOfferFormFieldRequest) => adminCreateOfferFormField(request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Form field created successfully")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminUpdateOfferFormField(serviceId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      fieldId,
      request,
    }: {
      fieldId: string
      request: UpdateOfferFormFieldRequest
    }) => adminUpdateOfferFormField(fieldId, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Form field updated")
      qc.invalidateQueries({ queryKey: offerServiceKeys.detail(serviceId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Platform Coupon Mutations ────────────────────────────────────────────────

export function useAdminCreatePlatformCoupon(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreatePlatformCouponRequest) => adminCreatePlatformCoupon(request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Platform coupon created")
      qc.invalidateQueries({ queryKey: ["offer-services", "coupons"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminDeactivatePlatformCoupon(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (couponId: string) => adminDeactivatePlatformCoupon(couponId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Coupon deactivated")
      qc.invalidateQueries({ queryKey: ["offer-services", "coupons"] })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
