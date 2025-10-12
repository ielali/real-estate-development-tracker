# Netlify Blobs Setup Guide

## Overview

Netlify Blobs is the file storage solution used for document uploads and project photos in this application. **No manual token configuration is required** - Netlify automatically injects all necessary environment variables.

## Important: NOT Vercel Blobs

This project uses **Netlify Blobs**, not Vercel Blobs. The environment variable `BLOB_READ_WRITE_TOKEN` is for Vercel Blobs and is **not used** in this project.

## How Netlify Blobs Works

### Automatic Configuration

Netlify automatically injects the following environment variable in all deployment contexts:

- `NETLIFY_BLOBS_CONTEXT` - Contains Base64-encoded JSON with:
  - API URL/Edge URL
  - Authentication token
  - Site ID
  - Deploy ID (for deploy-scoped stores)

### Environment-Aware Storage

The application uses different storage strategies based on environment:

**Production (`CONTEXT=production`)**:

```typescript
getStore({ name: "documents", consistency: "strong" })
```

- Uses global store
- Data persists across deploys
- Strong consistency for critical data

**Development/Preview (`CONTEXT != production`)**:

```typescript
getDeployStore("documents")
```

- Uses deploy-scoped store
- Isolated per branch/deploy
- Prevents test data contamination

## Local Development

### Option 1: Using `netlify dev` (Recommended)

```bash
cd apps/web
netlify dev
```

This command:

- Starts Next.js dev server on port 3000
- Starts Netlify proxy on port 8888
- Automatically injects `NETLIFY_BLOBS_CONTEXT`
- Provides full Netlify environment locally

Access the app at: **http://localhost:8888**

### Option 2: Deploy to Netlify

Since Netlify Blobs requires Netlify's environment:

1. Commit your changes
2. Push to GitHub
3. Netlify automatically deploys
4. All blob storage works automatically

Access via your Netlify preview URL or production domain.

### Option 3: Standard Dev Server (Limited)

```bash
cd apps/web
bun run dev
```

**Note**: Document upload will **not work** with this method as `NETLIFY_BLOBS_CONTEXT` is not available. Use this only for testing other features.

## Troubleshooting

### Error: MissingBlobsEnvironmentError

```
The environment has not been configured to use Netlify Blobs
```

**Cause**: Running outside Netlify environment without `NETLIFY_BLOBS_CONTEXT`

**Solutions**:

1. Use `netlify dev` instead of `bun run dev`
2. Deploy to Netlify for testing
3. Check that Netlify Blobs integration is enabled in site settings

### Netlify Dev Issues on ARM64

If `netlify dev` fails with Chromium/Puppeteer errors on ARM64:

```bash
PUPPETEER_SKIP_DOWNLOAD=true netlify dev
```

This skips the Lighthouse plugin's Chromium download (not needed for blob storage).

## Required Netlify Configuration

### Site Settings

1. Go to Netlify Dashboard → Your Site → Integrations
2. Enable **Netlify Blobs** integration
3. No additional configuration needed!

### Environment Variables

No environment variables need to be manually configured. Netlify automatically provides:

- `NETLIFY_BLOBS_CONTEXT` (auto-injected)
- `CONTEXT` (auto-set: `production`, `deploy-preview`, `branch-deploy`, or `dev`)

## Code Implementation

### Document Service

See [document.service.ts](../../apps/web/src/server/services/document.service.ts):

```typescript
function getBlobStore(storeName: string) {
  const isProduction = process.env.CONTEXT === "production"

  if (isProduction) {
    return getStore({ name: storeName, consistency: "strong" })
  }

  return getDeployStore(storeName) // Isolated per deploy
}
```

### Error Handling

The service includes helpful error messages:

```typescript
if (error instanceof Error && error.message.includes("MissingBlobsEnvironmentError")) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Netlify Blobs is not configured. Use 'netlify dev' for local development.",
  })
}
```

## Benefits of This Approach

✅ **Zero Configuration** - No tokens to manage
✅ **Secure** - Tokens never stored in code or `.env` files
✅ **Environment Isolation** - Dev/preview data separate from production
✅ **Automatic Deployment** - Works immediately on Netlify
✅ **Strong Typing** - Full TypeScript support

## Related Documentation

- [Netlify Blobs Official Docs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Story 3.2: Document Storage](../stories/3.2.story.md)
- [Deployment Guide](./deployment.md)
