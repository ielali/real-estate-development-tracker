import { db } from "../db"
import { projectBackups, type ProjectBackup } from "../db/schema"
import JSZip from "jszip"
import { TRPCError } from "@trpc/server"
import { documentService } from "./document.service"

// Timeout constants (in milliseconds)
const ZIP_BACKUP_TIMEOUT = 60000 // 60 seconds for ZIP generation
const MAX_ZIP_SIZE = 500 * 1024 * 1024 // 500MB max ZIP size

/**
 * Helper function to run a promise with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Backup JSON structure following versioned schema
 */
export interface ProjectBackupData {
  version: string // Schema version "1.0.0"
  exportedAt: string // ISO timestamp
  exportedBy: {
    id: string
    email: string
    name: string
  }
  project: {
    id: string
    name: string
    description: string | null
    projectType: string
    status: string
    startDate: string | null
    endDate: string | null
    totalBudget: number | null
    address: {
      id: string
      street: string | null
      city: string | null
      state: string | null
      zipCode: string | null
      country: string | null
    } | null
    createdAt: string
    updatedAt: string
  }
  costs: Array<{
    id: string
    amount: number
    description: string
    category: { id: string; name: string; type: string } | null
    date: string
    contact: {
      id: string
      firstName: string
      lastName: string | null
      company: string | null
      email: string | null
      phone: string | null
      category: { id: string; name: string } | null
    } | null
    documentIds: string[] | null
    createdBy: { id: string; email: string; name: string }
    createdAt: string
  }>
  contacts: Array<{
    id: string
    firstName: string
    lastName: string | null
    company: string | null
    email: string | null
    phone: string | null
    mobile: string | null
    website: string | null
    notes: string | null
    category: { id: string; name: string } | null
    address: {
      id: string
      street: string | null
      city: string | null
      state: string | null
      zipCode: string | null
      country: string | null
    } | null
    createdAt: string
  }>
  events: Array<{
    id: string
    title: string
    description: string | null
    date: string
    category: { id: string; name: string } | null
    createdBy: { id: string; email: string; name: string }
    createdAt: string
  }>
  documents: Array<{
    id: string
    fileName: string
    fileSize: number
    mimeType: string
    blobUrl: string // Netlify Blob URL for file access
    thumbnailUrl: string | null
    category: { id: string; name: string } | null
    uploadedBy: { id: string; email: string; name: string }
    createdAt: string
  }>
}

/**
 * Result of ZIP size estimation
 */
export interface ZipSizeEstimate {
  estimatedSize: number // Bytes
  documentCount: number
  warningMessage?: string
}

/**
 * Service for generating project backups (JSON and ZIP)
 */
export class BackupService {
  /**
   * Generate complete JSON backup of project data
   * @param projectId - Project UUID
   * @param userId - User requesting the backup
   * @returns Formatted JSON backup object
   */
  async generateProjectBackup(projectId: string, userId: string): Promise<ProjectBackupData> {
    // Fetch user details
    const user = await db.query.users.findFirst({
      where: (users: any, { eq }: any) => eq(users.id, userId), // eslint-disable-line @typescript-eslint/no-explicit-any
    })

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      })
    }

    // Use Drizzle relational queries for efficient data fetching
    const projectData = await db.query.projects.findFirst({
      where: (
        projects: any,
        { eq, and, isNull }: any // eslint-disable-line @typescript-eslint/no-explicit-any
      ) => and(eq(projects.id, projectId), isNull(projects.deletedAt)),
      with: {
        address: true,
        owner: true,
        costs: {
          where: (costs: any, { isNull }: any) => isNull(costs.deletedAt), // eslint-disable-line @typescript-eslint/no-explicit-any
          with: {
            category: true,
            contact: {
              with: { category: true, address: true },
            },
            createdBy: true,
          },
        },
        events: {
          where: (events: any, { isNull }: any) => isNull(events.deletedAt), // eslint-disable-line @typescript-eslint/no-explicit-any
          with: {
            category: true,
            createdBy: true,
          },
        },
        documents: {
          where: (documents: any, { isNull }: any) => isNull(documents.deletedAt), // eslint-disable-line @typescript-eslint/no-explicit-any
          with: {
            category: true,
            uploadedBy: true,
          },
        },
      },
    })

    if (!projectData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    // Get all unique contacts referenced in costs
    const contactIdsInCosts = projectData.costs
      .filter((cost: any) => cost.contactId) // eslint-disable-line @typescript-eslint/no-explicit-any
      .map((cost: any) => cost.contactId!) // eslint-disable-line @typescript-eslint/no-explicit-any
      .filter((id: any, index: any, self: any) => self.indexOf(id) === index) // eslint-disable-line @typescript-eslint/no-explicit-any

    // Fetch full contact details if any contacts are referenced
    const projectContacts =
      contactIdsInCosts.length > 0
        ? await db.query.contacts.findMany({
            where: (
              contacts: any,
              { and, isNull, inArray }: any // eslint-disable-line @typescript-eslint/no-explicit-any
            ) => and(isNull(contacts.deletedAt), inArray(contacts.id, contactIdsInCosts)),
            with: {
              category: true,
              address: true,
            },
          })
        : []

    // Build backup object with versioned schema
    const backup: ProjectBackupData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      project: {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        projectType: projectData.projectType,
        status: projectData.status,
        startDate: projectData.startDate ? projectData.startDate.toISOString() : null,
        endDate: projectData.endDate ? projectData.endDate.toISOString() : null,
        totalBudget: projectData.totalBudget,
        address: projectData.address
          ? {
              id: projectData.address.id,
              street: projectData.address.street,
              city: projectData.address.city,
              state: projectData.address.state,
              zipCode: projectData.address.zipCode,
              country: projectData.address.country,
            }
          : null,
        createdAt: projectData.createdAt.toISOString(),
        updatedAt: projectData.updatedAt.toISOString(),
      },
      costs: projectData.costs.map((cost: any) => ({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        id: cost.id,
        amount: cost.amount,
        description: cost.description,
        category: cost.category
          ? {
              id: cost.category.id,
              name: cost.category.displayName,
              type: cost.category.type,
            }
          : null,
        date: cost.date.toISOString(),
        contact: cost.contact
          ? {
              id: cost.contact.id,
              firstName: cost.contact.firstName,
              lastName: cost.contact.lastName,
              company: cost.contact.company,
              email: cost.contact.email,
              phone: cost.contact.phone,
              category: cost.contact.category
                ? {
                    id: cost.contact.category.id,
                    name: cost.contact.category.displayName,
                  }
                : null,
            }
          : null,
        documentIds: cost.documentIds,
        createdBy: {
          id: cost.createdBy.id,
          email: cost.createdBy.email,
          name: cost.createdBy.name,
        },
        createdAt: cost.createdAt.toISOString(),
      })),
      contacts: projectContacts.map((contact: any) => ({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        website: contact.website,
        notes: contact.notes,
        category: contact.category
          ? {
              id: contact.category.id,
              name: contact.category.displayName,
            }
          : null,
        address: contact.address
          ? {
              id: contact.address.id,
              street: contact.address.street,
              city: contact.address.city,
              state: contact.address.state,
              zipCode: contact.address.zipCode,
              country: contact.address.country,
            }
          : null,
        createdAt: contact.createdAt.toISOString(),
      })),
      events: projectData.events.map((event: any) => ({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        category: event.category
          ? {
              id: event.category.id,
              name: event.category.displayName,
            }
          : null,
        createdBy: {
          id: event.createdBy.id,
          email: event.createdBy.email,
          name: event.createdBy.name,
        },
        createdAt: event.createdAt.toISOString(),
      })),
      documents: projectData.documents.map((doc: any) => ({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        blobUrl: doc.blobUrl, // Include Netlify Blob URL
        thumbnailUrl: doc.thumbnailUrl,
        category: doc.category
          ? {
              id: doc.category.id,
              name: doc.category.displayName,
            }
          : null,
        uploadedBy: {
          id: doc.uploadedBy.id,
          email: doc.uploadedBy.email,
          name: doc.uploadedBy.name,
        },
        createdAt: doc.createdAt.toISOString(),
      })),
    }

    return backup
  }

  /**
   * Generate ZIP archive with project data and all document files
   *
   * BUG-001 FIX: Now fetches actual document blobs from Netlify Blobs storage
   * PERF-001 FIX: Includes timeout protection (60s maximum)
   *
   * @param projectId - Project UUID
   * @param userId - User requesting the backup
   * @param onProgress - Optional callback for progress tracking
   * @returns ZIP blob ready for download
   * @throws {TRPCError} INTERNAL_SERVER_ERROR - ZIP generation timeout or failure
   */
  async generateZipArchive(
    projectId: string,
    userId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const generateZip = async (): Promise<Blob> => {
      // 1. Generate JSON backup data
      const backupData = await this.generateProjectBackup(projectId, userId)
      const jsonString = JSON.stringify(backupData, null, 2)

      // 2. Create new ZIP archive
      const zip = new JSZip()

      // 3. Add JSON file to root
      zip.file("project-data.json", jsonString)

      // 4. Create documents folder
      const docsFolder = zip.folder("documents")
      if (!docsFolder) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create documents folder in ZIP",
        })
      }

      // 5. Fetch and add document files from Netlify Blobs
      const documents = backupData.documents
      const totalDocs = documents.length

      if (onProgress && totalDocs > 0) {
        onProgress(0, totalDocs)
      }

      // Fetch documents and add to ZIP
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        try {
          // BUG-001 FIX: Use blobUrl (which is actually the blob key) to fetch document
          const blobData = await documentService.getDocumentBlob(doc.blobUrl)

          // Add to ZIP with original filename prefixed by document ID for uniqueness
          const zipFileName = `${doc.id}-${doc.fileName}`
          docsFolder.file(zipFileName, blobData, { binary: true })
        } catch (error) {
          // Log error but continue with other documents
          console.error(`Failed to fetch document ${doc.id} (${doc.fileName}):`, error)

          // Add error placeholder file to ZIP so user knows this document is missing
          const errorFileName = `${doc.id}-${doc.fileName}.MISSING.txt`
          const errorMessage = `Document "${doc.fileName}" could not be retrieved from storage.\nDocument ID: ${doc.id}\nBlob Key: ${doc.blobUrl}\nError: ${error instanceof Error ? error.message : "Unknown error"}`
          docsFolder.file(errorFileName, errorMessage)
        }

        if (onProgress) {
          onProgress(i + 1, totalDocs)
        }
      }

      // 6. Generate ZIP blob
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }, // Balance between size and speed
      })

      return zipBlob
    }

    // PERF-001 FIX: Add timeout protection (60 seconds for ZIP generation)
    try {
      return await withTimeout(
        generateZip(),
        ZIP_BACKUP_TIMEOUT,
        "ZIP generation exceeded 60 second timeout. Project may be too large."
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message + " Please try JSON backup instead or contact support.",
        })
      }
      throw error
    }
  }

  /**
   * Estimate ZIP archive size before generation
   * @param projectId - Project UUID
   * @returns Estimated size in bytes and document count
   * @throws {TRPCError} BAD_REQUEST - Archive exceeds maximum size limit (500MB)
   */
  async estimateZipSize(projectId: string): Promise<ZipSizeEstimate> {
    // Fetch project with documents
    const projectData = await db.query.projects.findFirst({
      where: (
        projects: any,
        { eq, and, isNull }: any // eslint-disable-line @typescript-eslint/no-explicit-any
      ) => and(eq(projects.id, projectId), isNull(projects.deletedAt)),
      with: {
        documents: {
          where: (documents: any, { isNull }: any) => isNull(documents.deletedAt), // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      },
    })

    if (!projectData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    // Calculate total document size
    const totalDocSize = projectData.documents.reduce(
      (sum: any, doc: any) => sum + (doc.fileSize || 0), // eslint-disable-line @typescript-eslint/no-explicit-any
      0
    )

    // Estimate JSON size (roughly 50KB base)
    const estimatedJsonSize = 50 * 1024 // 50KB base estimate

    // Total estimate (ZIP compression typically achieves 20-40% reduction)
    // Using conservative 30% compression ratio
    const estimatedSize = Math.round((totalDocSize + estimatedJsonSize) * 0.7)

    // PERF-002 fix: Enforce hard limit on ZIP size to prevent memory exhaustion
    if (estimatedSize > MAX_ZIP_SIZE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Archive size (${Math.round(estimatedSize / 1024 / 1024)}MB) exceeds maximum limit of 500MB. Please contact support for assistance with large project exports.`,
      })
    }

    const documentCount = projectData.documents.length

    // Generate warning for large archives
    let warningMessage: string | undefined
    if (estimatedSize > 100 * 1024 * 1024) {
      warningMessage = "This archive will be over 100MB. Download may take several minutes."
    } else if (documentCount > 100) {
      warningMessage = "This archive contains many documents. Generation may take 1-2 minutes."
    }

    return { estimatedSize, documentCount, warningMessage }
  }

  /**
   * Record a backup in the database
   * @param projectId - Project UUID
   * @param userId - User who requested the backup
   * @param backupType - Type of backup ('json' or 'zip')
   * @param fileSize - Size of the backup file in bytes
   * @param documentCount - Number of documents included
   */
  async recordBackup(
    projectId: string,
    userId: string,
    backupType: "json" | "zip",
    fileSize: number,
    documentCount: number
  ): Promise<ProjectBackup> {
    const [backup] = await db
      .insert(projectBackups)
      .values({
        id: crypto.randomUUID(),
        projectId,
        userId,
        backupType,
        fileSize,
        documentCount,
        schemaVersion: "1.0.0",
      })
      .returning()

    if (!backup) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to record backup",
      })
    }

    return backup
  }

  /**
   * Get backup history for a project
   * @param projectId - Project UUID
   * @param limit - Maximum number of backups to return (default: 10)
   * @returns Array of recent backups
   */
  async getBackupHistory(projectId: string, limit: number = 10): Promise<ProjectBackup[]> {
    const backups = await db.query.projectBackups.findMany({
      where: (projectBackups: any, { eq }: any) => eq(projectBackups.projectId, projectId), // eslint-disable-line @typescript-eslint/no-explicit-any
      orderBy: (projectBackups: any, { desc }: any) => [desc(projectBackups.createdAt)], // eslint-disable-line @typescript-eslint/no-explicit-any
      limit,
    })

    return backups
  }
}

// Singleton instance
export const backupService = new BackupService()
