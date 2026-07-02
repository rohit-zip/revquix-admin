"use client"

import { Check, ClipboardCopy, Code2, FileCode2, ImageIcon, Link2 } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showSuccessToast } from "@/lib/show-toast"
import type { AssetResponse } from "./api/asset-manager.types"
import { isImageAsset } from "./api/asset-manager.types"

interface CopyOption {
  key: string
  label: string
  Icon: typeof Link2
  value: (a: AssetResponse) => string
  imageOnly?: boolean
}

const COPY_OPTIONS: CopyOption[] = [
  { key: "url", label: "Copy URL", Icon: Link2, value: (a) => a.publicUrl },
  {
    key: "markdown",
    label: "Copy Markdown",
    Icon: FileCode2,
    imageOnly: true,
    value: (a) => `![${a.altText || a.displayName || ""}](${a.publicUrl})`,
  },
  {
    key: "img",
    label: "Copy <img> tag",
    Icon: Code2,
    imageOnly: true,
    value: (a) =>
      `<img src="${a.publicUrl}" alt="${a.altText || ""}"${a.width ? ` width="${a.width}"` : ""}${a.height ? ` height="${a.height}"` : ""} />`,
  },
  {
    key: "next",
    label: "Copy Next <Image>",
    Icon: ImageIcon,
    imageOnly: true,
    value: (a) =>
      `<Image src="${a.publicUrl}" alt="${a.altText || ""}" width={${a.width ?? 0}} height={${a.height ?? 0}} />`,
  },
]

export function AssetCopyMenu({
  asset,
  children,
}: {
  asset: AssetResponse
  children: React.ReactNode
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const image = isImageAsset(asset)

  const handleCopy = async (option: CopyOption) => {
    const text = option.value(asset)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(option.key)
      showSuccessToast("Copied to clipboard")
      setTimeout(() => setCopiedKey(null), 1200)
    } catch {
      showSuccessToast("Copy failed — select and copy manually")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-2">
          <ClipboardCopy className="h-3.5 w-3.5" /> Copy as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COPY_OPTIONS.filter((o) => !o.imageOnly || image).map((option) => {
          const OptionIcon = option.Icon
          return (
            <DropdownMenuItem key={option.key} onClick={() => handleCopy(option)}>
              {copiedKey === option.key ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <OptionIcon className="h-4 w-4" />
              )}
              {option.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
