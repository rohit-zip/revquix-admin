/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Booking API Service
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { apiClient } from "@/lib/axios"
import type {
  AvailableSlotsResponse,
  BookingConfirmedResponse,
  BookingIntakeRequest,
  BookingIntakeResponse,
  ConfirmBookingRequest,
} from "./types"

export const bookingApi = {
  /**
   * Submit booking intake form (Step 1).
   * Returns intakeId + message — slots are fetched separately.
   */
  async submitIntake(data: BookingIntakeRequest): Promise<BookingIntakeResponse> {
    const response = await apiClient.post<BookingIntakeResponse>(
      "/bookings/intake",
      data,
    )
    return response.data
  },

  /**
   * Fetch available slots as UTC instants (Step 2 — separate call).
   * @param from  ISO-8601 UTC instant (defaults to now on server)
   * @param to    ISO-8601 UTC instant (defaults to +30 days on server)
   */
  async getAvailableSlots(from?: string, to?: string): Promise<AvailableSlotsResponse> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to

    const response = await apiClient.get<AvailableSlotsResponse>(
      "/bookings/available",
      { params },
    )
    return response.data
  },

  /**
   * Confirm a slot booking (Step 3).
   * Sends the intakeId + the selected slotStartUtc to lock the slot.
   */
  async confirmBooking(data: ConfirmBookingRequest): Promise<BookingConfirmedResponse> {
    const response = await apiClient.post<BookingConfirmedResponse>(
      "/bookings/confirm",
      data,
    )
    return response.data
  },
}

