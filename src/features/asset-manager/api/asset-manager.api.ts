import type { AxiosProgressEvent } from "axios"
import { apiClient } from "@/lib/axios"
import type {
  AssetListParams,
  AssetPageResponse,
  AssetResponse,
  AssetUpdateRequest,
  AssetUploadParams,
} from "./asset-manager.types"

const BASE = "/admin/assets"

export const listAssets = (params: AssetListParams): Promise<AssetPageResponse> =>
  apiClient
    .get<AssetPageResponse>(BASE, {
      params: {
        page: params.page,
        size: params.size,
        ...(params.folder ? { folder: params.folder } : {}),
        ...(params.search ? { search: params.search } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
      },
    })
    .then((r) => r.data)

export const listAssetFolders = (): Promise<string[]> =>
  apiClient.get<string[]>(`${BASE}/folders`).then((r) => r.data)

export const getAsset = (assetId: string): Promise<AssetResponse> =>
  apiClient.get<AssetResponse>(`${BASE}/${assetId}`).then((r) => r.data)

export const uploadAsset = (
  params: AssetUploadParams,
  onProgress?: (percent: number) => void,
): Promise<AssetResponse> => {
  const formData = new FormData()
  formData.append("file", params.file)
  if (params.name) formData.append("name", params.name)
  if (params.folder) formData.append("folder", params.folder)
  if (params.altText) formData.append("altText", params.altText)
  if (params.tags) params.tags.forEach((t) => formData.append("tags", t))
  if (params.optimize) formData.append("optimize", "true")
  if (params.forceNew) formData.append("forceNew", "true")

  return apiClient
    .post<AssetResponse>(BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    .then((r) => r.data)
}

export const updateAsset = (
  assetId: string,
  request: AssetUpdateRequest,
): Promise<AssetResponse> =>
  apiClient.patch<AssetResponse>(`${BASE}/${assetId}`, request).then((r) => r.data)

export const replaceAssetFile = (
  assetId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<AssetResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  return apiClient
    .put<AssetResponse>(`${BASE}/${assetId}/file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    .then((r) => r.data)
}

export const deleteAsset = (assetId: string): Promise<void> =>
  apiClient.delete(`${BASE}/${assetId}`).then(() => undefined)
