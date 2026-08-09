"use client"

import { useState } from "react"
import { ImageOff, Loader2, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAssetsList } from "@/features/asset-manager/api/asset-manager.hooks"
import type { AssetResponse } from "@/features/asset-manager/api/asset-manager.types"

/**
 * Picks a modal's image from the existing asset library.
 *
 * ─── Why picking, not uploading ─────────────────────────────────────────────
 *
 * The library is where uploads already happen, with the optimisation, dedupe by
 * checksum, and alt-text fields that path provides. A second upload route here
 * would either duplicate all of that or — far more likely — skip it, and produce
 * announcement images that are the only unoptimised assets on the site, missing
 * the alt text the modal needs for its `alt` attribute.
 *
 * ─── What the selection actually carries ────────────────────────────────────
 *
 * Only the asset id is stored. The URL, alt text and intrinsic dimensions are
 * resolved server-side at read time, so renaming or re-tagging an asset in the
 * library is reflected in every announcement using it, and a deleted asset
 * degrades to "no image" rather than a broken `<img>`.
 */
interface AnnouncementMediaPickerProps {
  /** Currently selected asset id, or null. */
  value: string | null
  onChange: (assetId: string | null) => void
}

export function AnnouncementMediaPicker({ value, onChange }: AnnouncementMediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AssetResponse | null>(null)

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border p-2.5">
          {selected ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.url}
              alt=""
              className="size-14 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded bg-muted">
              <ImageOff className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {selected?.displayName ?? selected?.originalFilename ?? value}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {selected?.altText
                ? `Alt: ${selected.altText}`
                : "No alt text on this asset — the modal will render it as decorative."}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null)
              setSelected(null)
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {value ? "Change image" : "Choose image"}
      </Button>

      {/*
        Mounted only while open, rather than always-rendered with an `enabled`
        flag on the query. `useAssetsList` is a shared hook with a positional
        signature and no `enabled` parameter, and widening it for one caller would
        change every other call site. Conditional mounting achieves the same thing
        — no asset request for a picker most saves never open — without touching
        code this feature does not own.
      */}
      {open ? (
        <AssetBrowser
          onClose={() => setOpen(false)}
          onSelect={(asset) => {
            onChange(asset.assetId)
            setSelected(asset)
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function AssetBrowser({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (asset: AssetResponse) => void
}) {
  const [search, setSearch] = useState("")

  const assets = useAssetsList(0, 24, undefined, search || undefined, "newest")

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="pl-8"
          />
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {assets.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (assets.data?.content ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No assets found. Upload one in the Asset Manager first.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {(assets.data?.content ?? []).map((asset) => (
                <button
                  key={asset.assetId}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className={cn(
                    "group overflow-hidden rounded-lg border text-left transition-colors",
                    "hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt=""
                    className="aspect-video w-full bg-muted object-cover"
                  />
                  <p className="truncate px-2 py-1.5 text-[11px]">
                    {asset.displayName ?? asset.originalFilename ?? asset.assetId}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
