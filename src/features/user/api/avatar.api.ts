import { apiClient } from "@/lib/axios"
import type { AvatarUploadResponse } from "./user.types"

/**
 * Uploads a profile photo to the backend.
 *
 * The backend validates the file (magic bytes, dimensions, size),
 * processes it to a max-512×512 JPEG, uploads it to Cloudflare R2,
 * and returns a 30-minute presigned URL.
 *
 * @param file a File or Blob — must be JPEG, PNG, or WebP, ≤ 5 MB raw
 * @returns AvatarUploadResponse with the new presigned avatarUrl
 */
export const uploadAvatar = (file: File | Blob): Promise<AvatarUploadResponse> => {
  const formData = new FormData()
  formData.append(
    "file",
    file instanceof File ? file : new File([file], "avatar.jpg", { type: "image/jpeg" }),
  )
  return apiClient
    .post<AvatarUploadResponse>("/user/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

/**
 * Removes the authenticated user's profile photo.
 * No-op on the server if no avatar is set.
 */
export const deleteAvatar = (): Promise<void> =>
  apiClient.delete("/user/me/avatar").then(() => undefined)

