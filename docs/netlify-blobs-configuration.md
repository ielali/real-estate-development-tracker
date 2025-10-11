# Netlify Blobs Configuration Guide

## Overview

This project uses **Netlify Blobs** for scalable document and photo storage. This guide explains the configuration, best practices, and local development setup.

## Architecture

### Storage Strategy

The application uses an **environment-aware storage strategy** to prevent test/dev data from contaminating production:

- **Production Environment** (`CONTEXT=production`):
  - Uses **global store** with `strong` consistency
  - Data persists across all deploys
  - Suitable for permanent user documents

- **Non-Production Environments** (dev, preview, branch-deploy):
  - Uses **deploy-scoped store**
  - Data is isolated per branch/deploy
  - Automatically cleaned up when deploy is deleted
  - Prevents test data contamination

### Implementation

See [apps/web/src/server/services/document.service.ts](../apps/web/src/server/services/document.service.ts):

```typescript
import { getStore, getDeployStore } from "@netlify/blobs"

function getBlobStore(storeName: string) {
  const isProduction = process.env.CONTEXT === "production"

  if (isProduction) {
    // Production: Global store with strong consistency
    return getStore({ name: storeName, consistency: "strong" })
  }

  // Non-production: Deploy-scoped store for data isolation
  return getDeployStore(storeName)
}
```

## Local Development

### Prerequisites

1. **Netlify CLI** installed globally:

   ```bash
   npm install -g netlify-cli
   ```

2. **Netlify account** and site linked:
   ```bash
   netlify link
   ```

### Running Locally

To use Netlify Blobs locally, you **must** use `netlify dev` instead of direct Next.js commands:

```bash
# ✅ Correct - Netlify CLI provides blob emulation
netlify dev

# ❌ Wrong - Won't have blob storage support
npm run dev
bun run dev
```

The Netlify CLI automatically:

- Emulates blob storage in a local sandbox
- Sets required environment variables
- Provides the same API as production

### Local Storage Location

Local blobs are stored in:

```
.netlify/blobs/
```

This directory is **already in `.gitignore`** and should never be committed.

## Store Configuration

### Store Name

The application uses a single store named **`documents`**:

```typescript
const store = getBlobStore("documents")
```

### Blob Keys

Documents are stored using their UUID as the blob key:

```typescript
await store.set(documentId, fileBuffer, {
  metadata: {
    fileName: "example.pdf",
    mimeType: "application/pdf",
    projectId: "project-uuid",
    uploadedAt: "2025-10-11T10:00:00.000Z",
  },
})
```

### Consistency Model

- **Production**: `strong` consistency
  - Updates are immediately visible
  - Slightly slower reads (acceptable tradeoff for data integrity)

- **Non-Production**: `eventual` consistency (default)
  - Faster reads
  - Updates propagate within 60 seconds

## API Usage

### Upload File

```typescript
import { documentService } from "@/server/services/document.service"

const blobKey = await documentService.upload(
  fileBuffer, // string | ArrayBuffer | Blob
  {
    name: "photo.jpg",
    size: 1024000, // bytes
    type: "image/jpeg",
  },
  documentId, // UUID
  projectId // UUID
)
```

### Retrieve File

```typescript
const content = await documentService.get(documentId)
```

### Delete File

```typescript
await documentService.delete(documentId)
```

## File Constraints

### Size Limits

- **Maximum file size**: 10MB per file (enforced by application)
- Netlify Blobs supports up to **5GB** per object, but we limit to 10MB for UX

### Supported MIME Types

```typescript
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
]
```

## Environment Variables

### Netlify Automatic Variables

Netlify automatically provides these in deployed environments:

- `NETLIFY_BLOBS_CONTEXT` - Current deploy context
- `CONTEXT` - Deploy context (production, deploy-preview, branch-deploy)

### Local Development

When using `netlify dev`, the CLI automatically configures:

- Local blob store path
- Site ID from `.netlify/state.json`
- Mock environment variables

**No manual configuration required!**

## Best Practices

### 1. Always Use Environment-Aware Stores

❌ **Don't** use global stores in all environments:

```typescript
const store = getStore("documents") // Wrong - contamination risk
```

✅ **Do** use environment-aware helper:

```typescript
const store = getBlobStore("documents") // Correct - isolated storage
```

### 2. Include Metadata

Always attach metadata to blobs for debugging and auditing:

```typescript
await store.set(key, data, {
  metadata: {
    fileName: file.name,
    mimeType: file.type,
    projectId: projectId,
    uploadedAt: new Date().toISOString(),
  },
})
```

### 3. Handle Errors Gracefully

```typescript
try {
  await store.set(key, data)
} catch (error) {
  console.error("Blob upload failed:", error)
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to upload document",
  })
}
```

### 4. Clean Up on Delete

When soft-deleting documents from the database, also remove the blob:

```typescript
// Delete from database (soft delete)
await db.documents.update({
  where: { id: documentId },
  data: { deletedAt: new Date() },
})

// Delete blob from storage
await documentService.delete(documentId)
```

## Deployment

### Netlify Configuration

The project is configured in [netlify.toml](../netlify.toml):

```toml
[build.environment]
  NODE_VERSION = "22"

[dev]
  command = "cd apps/web && bun run dev"
  framework = "#custom"
```

### Deploy Contexts

- **Production** (`main` branch): Uses global blob store
- **Deploy Previews** (PRs): Uses deploy-scoped store
- **Branch Deploys**: Uses deploy-scoped store

## Troubleshooting

### Error: "The environment has not been configured to use Netlify Blobs"

**Cause**: Running Next.js dev server directly instead of through Netlify CLI.

**Solution**: Use `netlify dev` instead of `npm run dev`.

**Technical Details**:

- The DocumentService uses **lazy initialization** for the blob store
- The store is only created when first accessed (not at module load time)
- If Netlify Blobs isn't available, you'll get a clear error message
- This prevents crashes on module import and provides better DX

### Local Blobs Not Persisting

**Expected Behavior**: Local blobs in `.netlify/blobs/` are sandboxed and may be cleared between sessions.

**Solution**: This is normal for local development. Deploy to test persistence.

### Production Blobs Not Found

**Debugging Steps**:

1. Verify environment context:

   ```typescript
   console.log("Context:", process.env.CONTEXT)
   ```

2. Check blob existence:

   ```typescript
   const exists = await store.getMetadata(documentId)
   console.log("Blob exists:", exists !== null)
   ```

3. List all blobs:
   ```typescript
   const { blobs } = await store.list()
   console.log(
     "All blobs:",
     blobs.map((b) => b.key)
   )
   ```

## Security Considerations

### 1. No Public Access

Netlify Blobs are **private by default**. Files cannot be accessed without:

- Application logic (server-side)
- Signed URLs (Story 3.2)

### 2. Server-Side Validation

Always validate files server-side:

```typescript
// ✅ Server validates
const metadata = documentService.processMetadata(file)
if (!metadata.isValid) {
  throw new TRPCError({ code: "BAD_REQUEST", message: metadata.error })
}
```

### 3. Access Control

Verify project ownership before allowing blob access:

```typescript
const project = await db.projects.findUnique({
  where: { id: projectId, ownerId: userId },
})

if (!project) {
  throw new TRPCError({ code: "FORBIDDEN" })
}
```

## References

- [Netlify Blobs Documentation](https://docs.netlify.com/blobs/overview/)
- [Netlify Blobs API Reference](https://sdk.netlify.com/modules/_netlify_blobs.html)
- [Local Development with Netlify CLI](https://docs.netlify.com/cli/local-development/)
- [Project Documentation](./stories/3.1.story.md)

## Change Log

| Date       | Version | Description                        | Author |
| ---------- | ------- | ---------------------------------- | ------ |
| 2025-10-11 | 1.0     | Initial Netlify Blobs config guide | Claude |
