import { apiClient } from "@/lib/axios"
import type { UpdateUsernameRequest, UsernameAvailabilityResponse } from "./user.types"

export const checkUsernameAvailability = (
  username: string,
): Promise<UsernameAvailabilityResponse> =>
  apiClient
    .get<UsernameAvailabilityResponse>("/username/available", { params: { username } })
    .then((r) => r.data)

export const updateUsername = (data: UpdateUsernameRequest): Promise<void> =>
  apiClient.patch("/username/update", data).then(() => undefined)

