"use client"

import { useState, useEffect } from "react"
import { FileIcon, ImageIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"

/**
 * ThumbnailImage component props
 */
interface ThumbnailImageProps {
  documentId: string
  fileName: string
  mimeType: string
  thumbnailUrl: string | null
}

/**
 * ThumbnailImage - Display document thumbnail with automatic fetching
 *
 * Fetches thumbnail blob from tRPC endpoint and displays as <img> tag.
 * Falls back to placeholder icons for non-image files or on error.
 *
 * @param documentId - Document ID to fetch thumbnail for
 * @param fileName - File name for alt text
 * @param mimeType - MIME type for fallback icon selection
 * @param thumbnailUrl - Thumbnail URL from database (blob key or icon path)
 */
export function ThumbnailImage({ documentId, fileName, thumbnailUrl }: ThumbnailImageProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const utils = api.useUtils()

  useEffect(() => {
    // If thumbnail is a placeholder icon path, use it directly
    if (thumbnailUrl?.startsWith("/icons/")) {
      setThumbnailSrc(thumbnailUrl ?? null)
      setIsLoading(false)
      return
    }

    // If no thumbnail URL, show fallback
    if (!thumbnailUrl) {
      setIsLoading(false)
      setHasError(true)
      return
    }

    // Fetch thumbnail blob from tRPC endpoint
    const fetchThumbnail = async () => {
      try {
        setIsLoading(true)
        const result = await utils.documents.getThumbnail.fetch(documentId)

        // If result is a placeholder path, use it
        if ("placeholderPath" in result) {
          setThumbnailSrc(result.placeholderPath ?? null)
          setIsLoading(false)
          return
        }

        // Convert base64 to blob URL for <img> tag
        const byteCharacters = atob(result.data)
        const byteArray = new Uint8Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i)
        }
        const blob = new Blob([byteArray], { type: result.mimeType })
        const blobUrl = URL.createObjectURL(blob)

        setThumbnailSrc(blobUrl)
        setIsLoading(false)

        // Cleanup blob URL on unmount
        return () => {
          URL.revokeObjectURL(blobUrl)
        }
      } catch (error) {
        console.error("Failed to fetch thumbnail:", error)
        setHasError(true)
        setIsLoading(false)
      }
    }

    fetchThumbnail()
  }, [documentId, thumbnailUrl, utils.documents.getThumbnail])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-200 animate-pulse">
        <ImageIcon className="h-16 w-16 text-gray-400" />
      </div>
    )
  }

  // Error state or no thumbnail - show icon based on MIME type
  if (hasError || !thumbnailSrc) {
    return (
      <div className="flex h-full items-center justify-center">
        <FileIcon className="h-16 w-16 text-gray-400" />
      </div>
    )
  }

  // Display thumbnail image
  return (
    <img
      src={thumbnailSrc}
      alt={`Thumbnail for ${fileName}`}
      className="h-full w-full object-cover"
      onError={() => setHasError(true)}
    />
  )
}
