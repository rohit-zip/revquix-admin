"use client"

import { useEffect, useState } from "react"
import { ImageOff, Plus, Search, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssetCard } from "./asset-card"
import { AssetEditDialog } from "./asset-edit-dialog"
import { AssetUploadDialog } from "./asset-upload-dialog"
import { useAssetFolders, useAssetsList } from "./api/asset-manager.hooks"
import { ASSET_SORT_OPTIONS } from "./api/asset-manager.types"
import type { AssetResponse, AssetSort } from "./api/asset-manager.types"

const PAGE_SIZE = 24
const ALL_FOLDERS = "__all__"

export function AssetManagerView() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [folder, setFolder] = useState<string>(ALL_FOLDERS)
  const [sort, setSort] = useState<AssetSort>("newest")
  const [editingAsset, setEditingAsset] = useState<AssetResponse | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data: folders } = useAssetFolders()
  const { data, isLoading, isError } = useAssetsList(
    page,
    PAGE_SIZE,
    folder === ALL_FOLDERS ? undefined : folder,
    search || undefined,
    sort,
  )

  const openEdit = (asset: AssetResponse) => {
    setEditingAsset(asset)
    setEditOpen(true)
  }

  const totalPages = data?.totalPages ?? 0
  const assets = data?.content ?? []

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Asset Manager</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage public media served from assets.revquix.com
          </p>
        </div>
        <AssetUploadDialog>
          <Button className="gap-1.5">
            <UploadCloud className="h-4 w-4" /> Upload
          </Button>
        </AssetUploadDialog>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-50 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag or key…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={folder}
          onValueChange={(v) => {
            setFolder(v)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FOLDERS}>All folders</SelectItem>
            {folders?.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as AssetSort)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-37.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Failed to load assets. Try again.</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {search || folder !== ALL_FOLDERS ? "No assets match your filters." : "No assets yet."}
          </p>
          <AssetUploadDialog>
            <Button variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Upload your first asset
            </Button>
          </AssetUploadDialog>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard key={asset.assetId} asset={asset} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} · {data?.totalElements ?? 0} assets
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AssetEditDialog
        key={editingAsset?.assetId ?? "none"}
        asset={editingAsset}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
