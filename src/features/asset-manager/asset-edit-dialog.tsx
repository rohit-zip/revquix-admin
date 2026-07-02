"use client"

import { useRef, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useReplaceAssetFile, useUpdateAsset } from "./api/asset-manager.hooks"
import type { AssetResponse } from "./api/asset-manager.types"
import { formatBytes } from "./api/asset-manager.types"

export function AssetEditDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: AssetResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const replaceInputRef = useRef<HTMLInputElement>(null)
  // Initialised from props; the parent remounts this dialog via `key` whenever
  // a different asset is edited, so no effect-based syncing is needed.
  const [displayName, setDisplayName] = useState(asset?.displayName || "")
  const [altText, setAltText] = useState(asset?.altText || "")
  const [tagsInput, setTagsInput] = useState((asset?.tags || []).join(", "))

  const { mutate: update, isPending: isSaving } = useUpdateAsset()
  const { mutate: replace, isPending: isReplacing } = useReplaceAssetFile()

  if (!asset) return null

  const handleSave = () => {
    update(
      {
        assetId: asset.assetId,
        request: {
          displayName: displayName.trim(),
          altText: altText.trim(),
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const handleReplace = (file: File) => {
    replace({ assetId: asset.assetId, file })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit asset</DialogTitle>
          <DialogDescription className="break-all">{asset.publicUrl}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Display name</Label>
            <Input
              id="edit-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-alt">Alt text</Label>
            <Input id="edit-alt" value={altText} onChange={(e) => setAltText(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* ── Replace file ── */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Replace file</p>
              <p className="text-xs text-muted-foreground">
                Keeps the same URL. Must be the same type (.{asset.extension}) ·{" "}
                {formatBytes(asset.sizeBytes)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isReplacing}
              onClick={() => replaceInputRef.current?.click()}
            >
              {isReplacing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Replace
            </Button>
            <input
              ref={replaceInputRef}
              type="file"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) handleReplace(e.target.files[0])
                e.target.value = ""
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
