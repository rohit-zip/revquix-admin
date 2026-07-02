"use client"

import { useState } from "react"
import {
  Copy,
  FileText,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AssetCopyMenu } from "./asset-copy-menu"
import { useDeleteAsset } from "./api/asset-manager.hooks"
import type { AssetResponse } from "./api/asset-manager.types"
import { formatBytes, isImageAsset } from "./api/asset-manager.types"

export function AssetCard({
  asset,
  onEdit,
}: {
  asset: AssetResponse
  onEdit: (asset: AssetResponse) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: remove, isPending: isDeleting } = useDeleteAsset()

  const image = isImageAsset(asset)
  const title = asset.displayName || asset.originalFilename || asset.objectKey

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      {/* ── Preview ── */}
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-muted/40">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.altText || title}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FileText className="h-10 w-10" />
            <span className="text-xs font-medium uppercase">{asset.extension}</span>
          </div>
        )}

        {asset.optimized && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 gap-1 bg-emerald-500/90 text-white"
          >
            <Sparkles className="h-3 w-3" /> Optimized
          </Badge>
        )}
      </div>

      {/* ── Meta ── */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" title={title}>
              {title}
            </p>
            <p className="text-xs text-muted-foreground">
              {asset.extension.toUpperCase()} · {formatBytes(asset.sizeBytes)}
              {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
            </p>
          </div>
        </div>

        {(asset.folder || (asset.tags && asset.tags.length > 0)) && (
          <div className="flex flex-wrap gap-1">
            {asset.folder && (
              <Badge variant="outline" className="text-[10px]">
                {asset.folder}
              </Badge>
            )}
            {asset.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="mt-auto flex items-center gap-1 pt-1">
          <AssetCopyMenu asset={asset}>
            <Button size="sm" variant="secondary" className="h-8 flex-1 gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </AssetCopyMenu>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onEdit(asset)}
            aria-label="Edit asset"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            aria-label="Delete asset"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Delete confirm ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-medium">{title}</span> from storage.
              Any page still referencing its URL will break. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                remove(asset.assetId, { onSuccess: () => setConfirmOpen(false) })
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
