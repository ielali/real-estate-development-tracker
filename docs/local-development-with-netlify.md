# Local Development with Netlify Blobs

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Development Server

**Important**: Use `netlify dev` instead of `npm run dev` to enable Netlify Blobs support:

```bash
netlify dev
```

This command:

- Starts Next.js dev server on port 3000
- Emulates Netlify Blobs locally
- Provides environment variable injection
- Simulates production environment

### 3. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Why Use `netlify dev`?

### ✅ With `netlify dev`

```bash
netlify dev
```

- ✅ Netlify Blobs work locally
- ✅ Environment variables auto-configured
- ✅ Same behavior as production
- ✅ Local blob storage in `.netlify/blobs/`

### ❌ Without `netlify dev`

```bash
npm run dev  # or bun run dev
```

- ❌ Netlify Blobs will fail
- ❌ Error: "The environment has not been configured to use Netlify Blobs"
- ❌ Missing environment context

## Testing File Uploads Locally

### 1. Navigate to a Project

```
http://localhost:3000/projects/[project-id]/documents
```

### 2. Upload a File

- Drag and drop a file
- Or click "Browse" to select files
- Supported formats: Images (JPG, PNG, WebP), PDFs, Documents (DOCX, XLSX)
- Max size: 10MB per file

### 3. Verify Upload

The file is stored in:

```
.netlify/blobs/deploy/documents/[document-id]
```

### 4. Check Blob Metadata

You can inspect blob metadata using Netlify CLI:

```bash
netlify blobs:list
```

## Environment Variables

### Automatic Variables (Set by Netlify CLI)

When running `netlify dev`, these are automatically set:

- `CONTEXT=dev` - Deploy context
- `NETLIFY=true` - Indicates Netlify environment
- `NETLIFY_DEV=true` - Indicates local dev mode

### Required Variables (Must be in `.env`)

Create `.env` file in `apps/web/`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth (Better Auth)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Other required vars...
```

## Blob Storage Behavior

### Local Development

- **Storage Location**: `.netlify/blobs/deploy/documents/`
- **Persistence**: Sandboxed, may be cleared between sessions
- **Scope**: Deploy-scoped (isolated per branch)

### Production

- **Storage Location**: Netlify's global CDN
- **Persistence**: Permanent (until manually deleted)
- **Scope**: Global store with strong consistency

## Common Commands

### Start Dev Server

```bash
netlify dev
```

### Run Tests

```bash
cd apps/web
bun run test
```

### Type Check

```bash
cd apps/web
bun run type-check
```

### Lint

```bash
cd apps/web
bun run lint
```

### Build for Production

```bash
cd apps/web
bun run build
```

## Troubleshooting

### Issue: "Netlify Blobs not configured"

**Cause**: Running Next.js directly instead of through Netlify CLI

**Solution**:

```bash
# Stop the current dev server (Ctrl+C)
# Start with Netlify CLI
netlify dev
```

### Issue: Port 3000 already in use

**Solution**:

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
netlify dev --port 3001
```

### Issue: Blobs not persisting between sessions

**Expected Behavior**: Local blobs in `.netlify/blobs/` are sandboxed and ephemeral.

**Solution**: This is normal for local development. Test persistence on a deployed environment.

### Issue: Environment variables not loading

**Check**:

1. Ensure `.env` file exists in `apps/web/`
2. Restart `netlify dev` after changing `.env`
3. Verify variables are loaded:
   ```bash
   netlify env:list
   ```

## Testing the Upload Flow

### End-to-End Test

1. **Start dev server**:

   ```bash
   netlify dev
   ```

2. **Open browser**: `http://localhost:3000`

3. **Create/Open a project**

4. **Navigate to Documents tab**

5. **Upload a test file**:
   - Try different file types (JPG, PDF, DOCX)
   - Test file size validation (try > 10MB)
   - Test invalid file types (TXT, EXE)

6. **Verify in terminal**: Check console logs for upload success

7. **Check local storage**:
   ```bash
   ls -la .netlify/blobs/deploy/documents/
   ```

## Next Steps

- [Netlify Blobs Configuration Guide](./netlify-blobs-configuration.md)
- [Story 3.1 Documentation](./stories/3.1.story.md)
- [Testing Strategy](../docs/architecture/testing-strategy.md)

## References

- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [Netlify Dev Documentation](https://docs.netlify.com/cli/local-development/)
- [Netlify Blobs Overview](https://docs.netlify.com/blobs/overview/)
