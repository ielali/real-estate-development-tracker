/**
 * Embedded Logo for PDF Generation
 *
 * The logo is embedded as a base64 data URI at build time to avoid
 * runtime fetch issues with Netlify's aggressive content optimization.
 *
 * Netlify applies content negotiation even for JPEG files, serving
 * WebP/AVIF formats that aren't compatible with @react-pdf/renderer.
 *
 * This constant is generated at build time via the generate-logo-constant.js script.
 */

import fs from "fs"
import path from "path"

let cachedLogoDataUri: string | null = null

/**
 * Get embedded logo as base64 data URI
 * Reads from the JPEG file at runtime (server-side only)
 */
export function getEmbeddedLogo(): string | null {
  if (cachedLogoDataUri) {
    return cachedLogoDataUri
  }

  try {
    const logoPath = path.join(process.cwd(), "public", "logo-pdf.jpg")
    const logoBuffer = fs.readFileSync(logoPath)
    const logoBase64 = logoBuffer.toString("base64")
    cachedLogoDataUri = `data:image/jpeg;base64,${logoBase64}`
    return cachedLogoDataUri
  } catch (error) {
    console.error("Failed to read embedded logo:", error)
    return null
  }
}
