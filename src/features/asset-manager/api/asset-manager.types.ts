// ─── ASSET MANAGER — TYPES ──────────────────────────────────────────────────

/** Public base URL where assets are served (Cloudflare custom domain). */
export const ASSETS_BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://assets.revquix.com"

/** First path segment for every asset key — matches the backend base-prefix. */
export const ASSETS_BASE_PREFIX = "revquix"

export type AssetSort = "newest" | "oldest" | "name" | "size"

export const ASSET_SORT_OPTIONS: { label: string; value: AssetSort }[] = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Name (A–Z)", value: "name" },
  { label: "Largest first", value: "size" },
]

export interface AssetResponse {
  assetId: string
  /** Ready-to-use URL including the ?v cache-buster. */
  url: string
  /** Canonical stable URL (no cache-buster). */
  publicUrl: string
  objectKey: string
  originalFilename: string | null
  displayName: string | null
  folder: string | null
  contentType: string
  extension: string
  sizeBytes: number
  width: number | null
  height: number | null
  optimized: boolean
  /** True when the upload reused an identical existing object. */
  duplicate: boolean
  altText: string | null
  tags: string[] | null
  uploadedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetPageResponse {
  content: AssetResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface AssetListParams {
  page: number
  size: number
  folder?: string
  search?: string
  sort?: AssetSort
}

export interface AssetUploadParams {
  file: File
  name?: string
  folder?: string
  altText?: string
  tags?: string[]
  optimize?: boolean
  forceNew?: boolean
}

export interface AssetUpdateRequest {
  displayName?: string
  altText?: string
  tags?: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Mirrors the backend slugify: lowercase, non-alnum → hyphen, trim, max 80. */
export function slugifyAssetName(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+)|(-+$)/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")
}

/** Best-effort extension from a File (used only for the live URL preview). */
export function guessExtension(file: File | null): string {
  if (!file) return ""
  const name = file.name || ""
  const dot = name.lastIndexOf(".")
  if (dot >= 0 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase()
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
  }
  return map[file.type] || ""
}

/** Builds the predicted public URL for the live preview in the upload dialog. */
export function buildPreviewUrl(name: string, folder: string, file: File | null): string {
  const slug = name.trim() ? slugifyAssetName(name) : "<random>"
  const folderSlug = folder.trim() ? slugifyAssetName(folder) : ""
  const ext = guessExtension(file)
  const segments = [ASSETS_BASE_PREFIX]
  if (folderSlug) segments.push(folderSlug)
  segments.push(`${slug || "<random>"}${ext ? "." + ext : ""}`)
  return `${ASSETS_BASE_URL}/${segments.join("/")}`
}

/** Human-readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

/** True for content types the grid can render as an <img> thumbnail. */
export function isImageAsset(a: AssetResponse): boolean {
  return a.contentType.startsWith("image/")
}
