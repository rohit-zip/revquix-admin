import { apiClient } from "@/lib/axios"
import type { CurrentUserResponse, UpdateNameRequest } from "./user.types"

export const getCurrentUser = (): Promise<CurrentUserResponse> =>
  apiClient.get<CurrentUserResponse>("/user/me").then((r) => r.data)

export const updateUserName = (data: UpdateNameRequest): Promise<CurrentUserResponse> =>
  apiClient.patch<CurrentUserResponse>("/user/me", data).then((r) => r.data)

