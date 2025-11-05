# Netlify Blobs Setup for Local Development

The report generation feature uses Netlify Blobs for temporary file storage.

## ✅ Quick Start (No Setup Required!)

**Good news!** The app uses **file system storage** for local development. No Netlify credentials needed!

```bash
npm run dev
```

**Local Development Features:**

- 💾 Reports persist in `.blobs/reports/` directory (gitignored)
- 🔍 Open PDFs/Excel files directly from disk for manual inspection
- ♻️ Survives server restarts
- 🧹 Auto-cleanup after 24 hours
- 🐛 Great for debugging report content
- 🚀 Zero configuration needed

## How It Works

### Local Development

The [local-blob-store.ts](../src/server/services/local-blob-store.ts) service provides file system storage that mimics the Netlify Blobs API:

**Storage Details:**

- Stores data in `.blobs/{storeName}/` directory structure (gitignored)
- Supports multiple blob stores (reports, documents, etc.) in separate subdirectories
- Each blob gets a `.blob` file (binary data) and `.meta.json` file (metadata)
- Persists across server restarts
- Automatic cleanup of expired files (24-hour TTL)
- Perfect for manual inspection and debugging
- No external dependencies or configuration needed

### Production & Deploy Previews

- Automatically uses real Netlify Blobs
- No configuration needed
- Persistent storage with 24-hour auto-expiry

## Advanced Setup (Optional)

If you want to use **real Netlify Blobs** in local development (for testing persistence, etc.), you can configure credentials:

### 1. Get Your Site ID

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **General** → **Site details**
4. Copy the **Site ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Generate a Personal Access Token

1. Go to: https://app.netlify.com/user/applications#personal-access-tokens
2. Click **New access token**
3. Give it a descriptive name (e.g., "Local Development - Reports")
4. Set expiration (optional - recommended for security)
5. Click **Generate token**
6. **Copy the token immediately** (you won't be able to see it again)

### 3. Add to Your .env File

Add these variables to your `.env` file in the `apps/web` directory:

```bash
# Netlify Blobs Configuration (for local report generation)
NETLIFY_SITE_ID=your-site-id-here
NETLIFY_TOKEN=your-personal-access-token-here
```

### 4. Restart Your Development Server

```bash
npm run dev
```

## Security Notes

- ⚠️ **Never commit your `.env` file** - it's already in `.gitignore`
- 🔒 Your personal access token has full access to your Netlify account - keep it secure
- 🔄 Rotate tokens periodically for better security
- 👥 Each developer should use their own personal access token

## Testing in Different Environments

### Local Development

Requires `NETLIFY_SITE_ID` and `NETLIFY_TOKEN` in `.env`

### Netlify Deploy Previews

Automatically configured - no setup needed

### Production

Automatically configured - no setup needed

## Troubleshooting

### Error: "Netlify Blobs not configured for local development"

**Solution:** Make sure both `NETLIFY_SITE_ID` and `NETLIFY_TOKEN` are set in your `.env` file.

### Error: "Unauthorized" or "Invalid token"

**Solutions:**

1. Verify your token hasn't expired
2. Regenerate a new personal access token
3. Make sure the token has the correct permissions

### Reports work in production but not locally

**Solution:** Local development requires explicit configuration. Follow the setup steps above.

## Alternative: Skip Local Blob Storage

If you don't need to test report generation locally, you can:

1. Test report generation in Netlify Deploy Previews (automatic configuration)
2. Use the comprehensive test suite instead:
   ```bash
   npm run test:run -- src/server/api/routers/__tests__/reports.test.ts
   ```

## Related Documentation

- [Netlify Blobs Documentation](https://docs.netlify.com/blobs/overview/)
- [Personal Access Tokens](https://docs.netlify.com/api/get-started/#authentication)
- [Story 9.1: Professional Financial Report Generation](../../docs/stories/9.1.story.md)
