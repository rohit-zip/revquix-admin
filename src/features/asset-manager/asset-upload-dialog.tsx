"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2,
  CloudUpload,
  Copy,
  FileIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError } from "@/lib/api-error"
import { uploadAsset } from "./api/asset-manager.api"
import { assetQueryKeys } from "./api/asset-manager.hooks"
import type { AssetResponse } from "./api/asset-manager.types"
import { buildPreviewUrl, formatBytes } from "./api/asset-manager.types"

type ItemStatus = "pending" | "uploading" | "done" | "error"

interface UploadItem {
  id: string
  file: File
  status: ItemStatus
  progress: number
  result?: AssetResponse
  error?: string
}

let itemCounter = 0
const nextId = () => `${Date.now()}-${itemCounter++}`

export function AssetUploadDialog({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Shared metadata
  const [name, setName] = useState("")
  const [folder, setFolder] = useState("")
  const [altText, setAltText] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [optimize, setOptimize] = useState(false)

  const singleFile = items.length === 1 ? items[0].file : null
  const allDone = items.length > 0 && items.every((i) => i.status === "done")

  const previewUrl = useMemo(
    () => (singleFile ? buildPreviewUrl(name, folder, singleFile) : null),
    [name, folder, singleFile],
  )

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).map((file) => ({
      id: nextId(),
      file,
      status: "pending" as ItemStatus,
      progress: 0,
    }))
    setItems((prev) => [...prev, ...incoming])
  }, [])

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const resetAll = () => {
    setItems([])
    setName("")
    setFolder("")
    setAltText("")
    setTagsInput("")
    setOptimize(false)
    setIsUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const parseTags = () =>
    tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

  const updateItem = (id: string, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const handleUpload = async () => {
    const pending = items.filter((i) => i.status === "pending" || i.status === "error")
    if (pending.length === 0) return

    setIsUploading(true)
    const tags = parseTags()
    let anyDuplicate = false
    let successCount = 0

    for (const item of pending) {
      updateItem(item.id, { status: "uploading", progress: 0, error: undefined })
      try {
        const result = await uploadAsset(
          {
            file: item.file,
            // Only apply a custom name when a single file is being uploaded.
            name: items.length === 1 ? name.trim() || undefined : undefined,
            folder: folder.trim() || undefined,
            altText: items.length === 1 ? altText.trim() || undefined : undefined,
            tags: tags.length ? tags : undefined,
            optimize,
          },
          (p) => updateItem(item.id, { progress: p }),
        )
        if (result.duplicate) anyDuplicate = true
        successCount += 1
        updateItem(item.id, { status: "done", progress: 100, result })
      } catch (err) {
        const message = (err as ApiError)?.message || "Upload failed"
        updateItem(item.id, { status: "error", error: message })
        showErrorToast(err as ApiError)
      }
    }

    setIsUploading(false)
    queryClient.invalidateQueries({ queryKey: assetQueryKeys.all })
    if (successCount > 0) {
      showSuccessToast(
        anyDuplicate ? "Upload complete (identical files reused)" : "Upload complete",
      )
    }
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccessToast("URL copied")
    } catch {
      /* ignore */
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) resetAll()
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload assets</DialogTitle>
          <DialogDescription>
            Drop images, SVGs, GIFs, PDFs or documents. A blank name gets a random slug.
          </DialogDescription>
        </DialogHeader>

        {/* ── Drop zone ── */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/40"
          }`}
        >
          <CloudUpload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Drag & drop or click to browse</span>
          <span className="text-xs text-muted-foreground">Multiple files supported · max 25&nbsp;MB each</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </button>

        {/* ── Selected files ── */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-md border p-2">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                  {item.status === "uploading" && (
                    <Progress value={item.progress} className="mt-1 h-1.5" />
                  )}
                  {item.status === "done" && item.result && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="truncate text-xs text-muted-foreground">
                        {item.result.duplicate ? "Reused existing · " : ""}
                        {item.result.publicUrl}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyUrl(item.result!.publicUrl)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {item.status === "error" && (
                    <span className="mt-1 block text-xs text-destructive">{item.error}</span>
                  )}
                </div>
                {item.status === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : item.status !== "done" ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* ── Metadata fields ── */}
        {items.length > 0 && !allDone && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.length === 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="asset-name">Name (optional)</Label>
                <Input
                  id="asset-name"
                  placeholder="Random if blank"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="asset-folder">Folder (optional)</Label>
              <Input
                id="asset-folder"
                placeholder="e.g. blog, email, marketing"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              />
            </div>
            {items.length === 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="asset-alt">Alt text (optional)</Label>
                <Input
                  id="asset-alt"
                  placeholder="Describe the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="asset-tags">Tags (comma-separated)</Label>
              <Input
                id="asset-tags"
                placeholder="hero, banner"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Optimize images</p>
                <p className="text-xs text-muted-foreground">
                  Re-encode raster images to WebP and cap dimensions to shrink payloads.
                </p>
              </div>
              <Switch checked={optimize} onCheckedChange={setOptimize} />
            </div>

            {/* ── Live URL preview ── */}
            {previewUrl && (
              <div className="rounded-md bg-muted/50 p-2 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Preview URL</p>
                <code className="break-all text-xs text-foreground">{previewUrl}</code>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {allDone ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={items.length === 0 || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Upload {items.length > 0 ? `(${items.length})` : ""}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
