"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  deleteAsset,
  listAssetFolders,
  listAssets,
  replaceAssetFile,
  updateAsset,
} from "./asset-manager.api"
import type {
  AssetListParams,
  AssetSort,
  AssetUpdateRequest,
} from "./asset-manager.types"

export const assetQueryKeys = {
  all: ["assets"] as const,
  list: (params: AssetListParams) =>
    ["assets", "list", params.page, params.size, params.folder, params.search, params.sort] as const,
  folders: ["assets", "folders"] as const,
}

export function useAssetsList(
  page: number,
  size: number,
  folder?: string,
  search?: string,
  sort?: AssetSort,
) {
  const params: AssetListParams = { page, size, folder, search, sort }
  return useQuery({
    queryKey: assetQueryKeys.list(params),
    queryFn: () => listAssets(params),
  })
}

export function useAssetFolders() {
  return useQuery({
    queryKey: assetQueryKeys.folders,
    queryFn: () => listAssetFolders(),
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateAsset>>,
    ApiError | NetworkError,
    { assetId: string; request: AssetUpdateRequest }
  >({
    mutationFn: ({ assetId, request }) => updateAsset(assetId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all })
      showSuccessToast("Asset updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useReplaceAssetFile() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof replaceAssetFile>>,
    ApiError | NetworkError,
    { assetId: string; file: File; onProgress?: (p: number) => void }
  >({
    mutationFn: ({ assetId, file, onProgress }) => replaceAssetFile(assetId, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all })
      showSuccessToast("File replaced")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: (assetId) => deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all })
      showSuccessToast("Asset deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}
