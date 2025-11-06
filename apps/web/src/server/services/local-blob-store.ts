/**
 * Local Blob Store for Development
 *
 * File system storage for local development that mimics the Netlify Blobs API.
 *
 * Features:
 * - Stores blobs in `.blobs/{storeName}/` directory structure (gitignored)
 * - Supports multiple blob stores (reports, documents, etc.)
 * - Persists across server restarts
 * - Automatic cleanup of expired files (24-hour TTL)
 * - Perfect for manual inspection and debugging
 */

import fs from "fs"
import path from "path"

class LocalBlobStore {
  private name: string
  private baseDir: string

  constructor(name: string) {
    this.name = name
    // Use .blobs/ as base directory with store name as subdirectory
    this.baseDir = path.join(process.cwd(), ".blobs", name)

    // Create directory structure
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
    console.log(
      `📦 Local Blob Store initialized: "${name}" (file system storage at ${this.baseDir})`
    )

    // Clean up expired files on initialization
    this.cleanupExpiredFiles()
  }

  private getFilePath(key: string): string {
    // Replace slashes with underscores for file system safety
    const safeKey = key.replace(/\//g, "_")
    return path.join(this.baseDir, `${safeKey}.blob`)
  }

  private getMetadataPath(key: string): string {
    const safeKey = key.replace(/\//g, "_")
    return path.join(this.baseDir, `${safeKey}.meta.json`)
  }

  private cleanupExpiredFiles(): void {
    try {
      const files = fs.readdirSync(this.baseDir)
      const now = new Date()
      let cleanedCount = 0

      for (const file of files) {
        if (!file.endsWith(".meta.json")) continue

        const metaPath = path.join(this.baseDir, file)
        const metadataStr = fs.readFileSync(metaPath, "utf-8")
        const metadata = JSON.parse(metadataStr)

        if (metadata.expiresAt) {
          const expiresAt = new Date(metadata.expiresAt)
          if (expiresAt < now) {
            // Delete expired blob and metadata
            const blobFile = file.replace(".meta.json", ".blob")
            const blobPath = path.join(this.baseDir, blobFile)

            if (fs.existsSync(blobPath)) {
              fs.unlinkSync(blobPath)
            }
            fs.unlinkSync(metaPath)
            cleanedCount++
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired file(s) from local blob store`)
      }
    } catch (error) {
      console.error("Error cleaning up expired files:", error)
    }
  }

  async set(
    key: string,
    value: ArrayBuffer,
    options?: { metadata?: Record<string, string> }
  ): Promise<void> {
    const metadata = options?.metadata || {}
    const filePath = this.getFilePath(key)
    const metaPath = this.getMetadataPath(key)

    fs.writeFileSync(filePath, Buffer.from(value))
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    console.log(`✅ Local Blob Store: SET ${key} (${value.byteLength} bytes) → ${filePath}`)
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const filePath = this.getFilePath(key)

    if (!fs.existsSync(filePath)) {
      console.log(`❌ Local Blob Store: GET ${key} (not found)`)
      return null
    }

    const buffer = fs.readFileSync(filePath)
    console.log(`✅ Local Blob Store: GET ${key} (${buffer.byteLength} bytes)`)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  }

  async getMetadata(key: string): Promise<Record<string, string> | null> {
    const metaPath = this.getMetadataPath(key)

    if (!fs.existsSync(metaPath)) {
      return null
    }

    const metadataStr = fs.readFileSync(metaPath, "utf-8")
    return JSON.parse(metadataStr)
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key)
    const metaPath = this.getMetadataPath(key)

    let existed = false
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      existed = true
    }
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath)
      existed = true
    }

    if (existed) {
      console.log(`🗑️  Local Blob Store: DELETE ${key}`)
    }
  }

  async list(): Promise<{ blobs: Array<{ key: string }> }> {
    const files = fs.existsSync(this.baseDir) ? fs.readdirSync(this.baseDir) : []
    const blobs = files
      .filter((file) => file.endsWith(".blob"))
      .map((file) => ({
        key: file.replace(".blob", "").replace(/_/g, "/"),
      }))
    console.log(`📋 Local Blob Store: LIST (${blobs.length} items)`)
    return { blobs }
  }
}

// Singleton instances
const stores = new Map<string, LocalBlobStore>()

/**
 * Get a local blob store instance
 */
export function getLocalStore(options: { name: string }): LocalBlobStore {
  const { name } = options

  if (!stores.has(name)) {
    stores.set(name, new LocalBlobStore(name))
  }

  return stores.get(name)!
}

/**
 * Clear all local blob stores (useful for testing)
 */
export function clearAllLocalStores(): void {
  stores.clear()
  console.log("🧹 All local blob stores cleared")
}
