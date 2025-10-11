# Netlify Blobs - Quick Reference

## 🚀 TL;DR

```bash
# Start development server with Netlify Blobs support
netlify dev
```

**Never use `npm run dev` or `bun run dev` - Netlify Blobs won't work!**

## ✅ What's Configured

Your Netlify Blobs setup includes:

1. **Environment-Aware Storage**
   - ✅ Production → Global store (persistent)
   - ✅ Dev/Preview → Deploy-scoped store (isolated)

2. **Automatic Local Emulation**
   - ✅ Works with `netlify dev` command
   - ✅ No manual configuration needed
   - ✅ Blobs stored in `.netlify/blobs/` (gitignored)

3. **Production-Ready**
   - ✅ Strong consistency in production
   - ✅ Metadata tracking
   - ✅ Error handling

## 📁 Files Modified

### Updated

- [apps/web/src/server/services/document.service.ts](apps/web/src/server/services/document.service.ts)
  - Added environment-aware blob store selection
  - Fixed TypeScript compatibility
  - Added get/delete methods

### Created

- [docs/netlify-blobs-configuration.md](docs/netlify-blobs-configuration.md) - Full config guide
- [docs/local-development-with-netlify.md](docs/local-development-with-netlify.md) - Local dev guide

## 🛠️ Key Implementation

### Environment Detection

```typescript
// Automatically selects the right store
function getBlobStore(storeName: string) {
  const isProduction = process.env.CONTEXT === "production"

  if (isProduction) {
    return getStore({ name: storeName, consistency: "strong" })
  }

  return getDeployStore(storeName)
}
```

### Usage in DocumentService

```typescript
// Upload file
const blobKey = await documentService.upload(
  fileBuffer,
  { name: "photo.jpg", size: 1024000, type: "image/jpeg" },
  documentId,
  projectId
)

// Get file
const content = await documentService.get(documentId)

// Delete file
await documentService.delete(documentId)
```

## 🔧 Local Development

### Start Server

```bash
netlify dev
```

### Test File Upload

1. Go to `http://localhost:3000/projects/[id]/documents`
2. Upload a file (max 10MB)
3. Check `.netlify/blobs/deploy/documents/`

### Verify Configuration

```bash
netlify status
```

## 📊 Storage Strategy

| Environment | Store Type    | Consistency | Persistence | Data Isolation           |
| ----------- | ------------- | ----------- | ----------- | ------------------------ |
| Production  | Global        | Strong      | Permanent   | Shared across deploys    |
| Preview     | Deploy-scoped | Eventual    | Temporary   | Isolated per PR          |
| Branch      | Deploy-scoped | Eventual    | Temporary   | Isolated per branch      |
| Local       | Deploy-scoped | Eventual    | Sandboxed   | Isolated per dev session |

## 🔒 Security Features

- ✅ Private by default (no public URLs)
- ✅ Server-side validation
- ✅ Project ownership verification
- ✅ File type and size restrictions
- ✅ Metadata tracking

## 📝 Supported File Types

- **Images**: JPG, PNG, WebP, HEIC
- **Documents**: PDF, DOCX, XLSX
- **Max Size**: 10MB per file

## 🐛 Troubleshooting

### "Netlify Blobs not configured" error

**Cause**: Running Next.js directly

**Fix**:

```bash
# Stop current server
# Run with Netlify CLI
netlify dev
```

### Blobs not persisting locally

**Expected**: Local blobs are sandboxed and ephemeral

**Solution**: Test persistence on deployed environments

## 📚 Documentation

- [Full Configuration Guide](docs/netlify-blobs-configuration.md)
- [Local Development Guide](docs/local-development-with-netlify.md)
- [Story 3.1 Documentation](docs/stories/3.1.story.md)

## 🎯 Next Steps

1. Start development: `netlify dev`
2. Test file uploads at `/projects/[id]/documents`
3. Review [Configuration Guide](docs/netlify-blobs-configuration.md) for advanced usage
4. See [Local Dev Guide](docs/local-development-with-netlify.md) for troubleshooting

---

**⚠️ Remember**: Always use `netlify dev` for local development to enable Netlify Blobs!
