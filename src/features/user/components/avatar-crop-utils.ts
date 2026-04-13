"use client"

/**
 * Utility: crop a source image URL to a pixel-exact blob using the canvas API.
 * Returns a JPEG blob with quality 0.92 (high quality for the client crop preview).
 */
export async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  outputSize = 512,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"))

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        outputSize,
        outputSize,
      )

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob returned null"))
        },
        "image/jpeg",
        0.92,
      )
    }
    image.onerror = () => reject(new Error("Failed to load image for cropping"))
    image.src = imageSrc
  })
}

/**
 * Reads a File as a data URL (for preview / cropper source).
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Client-side size guard before sending to the backend.
 * Returns an error message or null if OK.
 */
export function validateFileSize(file: File | Blob, maxBytes = 5 * 1024 * 1024): string | null {
  if (file.size > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(0)
    const actualMb = (file.size / (1024 * 1024)).toFixed(1)
    return `File too large (${actualMb} MB). Maximum is ${mb} MB.`
  }
  return null
}

/**
 * Validates accepted MIME types on the client (defence-in-depth; real validation is server-side).
 */
export function validateFileType(file: File): string | null {
  const accepted = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!accepted.includes(file.type)) {
    return "Unsupported format. Please upload a JPEG, PNG, or WebP image."
  }
  return null
}

