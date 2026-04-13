"use client"

import React, { useCallback, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import { Camera, Loader2, Trash2, Upload, X, ZoomIn } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { uploadAvatar, deleteAvatar } from "@/features/user/api/avatar.api"
import { showErrorToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getCroppedBlob,
  readFileAsDataUrl,
  validateFileSize,
  validateFileType,
} from "./avatar-crop-utils"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarUploadModalProps {
  open: boolean
  onClose: () => void
  /** Called with the new presigned URL after a successful upload */
  onUploadSuccess: (newAvatarUrl: string) => void
  /** Called after the avatar is successfully deleted */
  onDeleteSuccess: () => void
  /** Current avatar URL (to show preview and enable delete button) */
  currentAvatarUrl?: string | null
}

type ModalView = "menu" | "cropper"

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Avatar management modal — used from the settings/profile page.
 *
 * Two views:
 * 1. **menu** — shows current avatar, upload button, delete button
 * 2. **cropper** — circular crop + zoom slider + apply/cancel
 *
 * On "Apply Crop":
 * - Canvas extracts the cropped JPEG blob (512×512)
 * - Blob is sent to `POST /api/v1/user/me/avatar`
 * - On success, parent state is updated via `onUploadSuccess`
 */
export function AvatarUploadModal({
  open,
  onClose,
  onUploadSuccess,
  onDeleteSuccess,
  currentAvatarUrl,
}: AvatarUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cropper state
  const [view, setView] = useState<ModalView>("menu")
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Loading states
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const handleClose = () => {
    if (isUploading || isDeleting) return
    resetCropper()
    onClose()
  }

  const resetCropper = () => {
    setView("menu")
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setFileError(null)
  }

  // ── File selection ─────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!fileInputRef.current) fileInputRef.current!.value = ""
    if (!file) return

    const typeError = validateFileType(file)
    if (typeError) { setFileError(typeError); return }

    const sizeError = validateFileSize(file)
    if (sizeError) { setFileError(sizeError); return }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImageSrc(dataUrl)
      setZoom(1)
      setCrop({ x: 0, y: 0 })
      setView("cropper")
    } catch {
      setFileError("Could not read the selected file.")
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleApplyAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsUploading(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, 512)
      const response = await uploadAvatar(blob)
      onUploadSuccess(response.avatarUrl)
      resetCropper()
      onClose()
    } catch (err) {
      showErrorToast(err as ApiError | NetworkError)
    } finally {
      setIsUploading(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAvatar()
      onDeleteSuccess()
      onClose()
    } catch (err) {
      showErrorToast(err as ApiError | NetworkError)
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => { if (isUploading || isDeleting) e.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle>
            {view === "cropper" ? "Crop your photo" : "Profile photo"}
          </DialogTitle>
        </DialogHeader>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Choose a profile photo"
        />

        {/* ── Menu view ───────────────────────────────────────────────────── */}
        {view === "menu" && (
          <div className="space-y-5">
            {/* Current avatar preview */}
            <div className="flex justify-center">
              <div className="relative h-28 w-28">
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentAvatarUrl}
                    alt="Current profile photo"
                    className="h-28 w-28 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted ring-2 ring-border">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {fileError && (
              <p className="text-center text-sm text-destructive">{fileError}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
                variant="default"
              >
                <Upload className="h-4 w-4" />
                {currentAvatarUrl ? "Change photo" : "Upload photo"}
              </Button>

              {currentAvatarUrl && (
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Removing…</>
                    : <><Trash2 className="h-4 w-4" /> Remove photo</>
                  }
                </Button>
              )}

              <Button variant="ghost" onClick={handleClose} className="w-full" disabled={isDeleting}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Cropper view ────────────────────────────────────────────────── */}
        {view === "cropper" && imageSrc && (
          <div className="space-y-4">
            {/* Crop area */}
            <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 px-1">
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(values: number[]) => setZoom(values[0]!)}
                className="flex-1"
                aria-label="Zoom"
              />
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {zoom.toFixed(1)}×
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetCropper}
                disabled={isUploading}
                className={cn("flex-1 gap-2")}
              >
                <X className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleApplyAndUpload}
                disabled={isUploading}
                className="flex-1 gap-2"
              >
                {isUploading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                  : <><Upload className="h-4 w-4" /> Apply & Upload</>
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


