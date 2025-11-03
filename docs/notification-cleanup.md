# Notification Cleanup Job

**Story 8.1: In-App Notification System (AC #15)**

Automated cleanup of notifications older than 90 days to prevent database bloat and maintain optimal performance.

## Overview

The notification cleanup system provides three ways to delete old notifications:

1. **API Endpoint** - For scheduled cron jobs (Vercel Cron, GitHub Actions, etc.)
2. **Manual Script** - For local testing and one-time cleanups
3. **Service Function** - For custom integrations

## Setup

### 1. Environment Variable

Add the `CRON_SECRET` to your environment:

```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env.local (development)
CRON_SECRET="your-generated-secret-here"

# Add to Vercel (production)
# Dashboard → Settings → Environment Variables → Add
```

### 2. Configure Scheduled Job (Optional)

#### Option A: Vercel Cron

Create or update `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-notifications",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Schedule runs daily at 2:00 AM UTC. Vercel automatically injects the authorization header.

#### Option B: GitHub Actions

Create `.github/workflows/cleanup-notifications.yml`:

```yaml
name: Cleanup Old Notifications
on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            ${{ secrets.APP_URL }}/api/cron/cleanup-notifications
```

Add secrets in GitHub:

- `CRON_SECRET` - Your cron secret
- `APP_URL` - Your production URL (e.g., `https://app.example.com`)

#### Option C: External Cron Service

Use services like cron-job.org, EasyCron, or similar:

```bash
# POST request with authorization header
POST https://your-app.vercel.app/api/cron/cleanup-notifications
Authorization: Bearer YOUR_CRON_SECRET
```

## Usage

### API Endpoint

**Endpoint:** `/api/cron/cleanup-notifications`

**Authentication:** Bearer token (CRON_SECRET)

#### Delete Old Notifications (POST)

```bash
# Standard cleanup (90 days)
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup-notifications

# Custom age threshold (30 days)
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup-notifications?days=30

# Dry run (no deletion, just count)
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup-notifications?dryRun=true
```

**Response:**

```json
{
  "success": true,
  "dryRun": false,
  "message": "Successfully deleted 1234 notifications",
  "deletedCount": 1234,
  "cutoffDate": "2024-08-01T00:00:00.000Z",
  "daysOld": 90,
  "timestamp": "2024-11-03T02:00:00.000Z"
}
```

#### Check Count (GET)

```bash
# Check how many notifications would be deleted
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup-notifications?days=90
```

**Response:**

```json
{
  "success": true,
  "count": 1234,
  "cutoffDate": "2024-08-01T00:00:00.000Z",
  "daysOld": 90,
  "message": "1234 notifications are older than 90 days"
}
```

### Manual Script

The manual script provides an interactive way to clean up notifications locally.

```bash
# Dry run (shows what would be deleted)
bun run scripts/cleanup-notifications.ts --dry-run

# Delete notifications older than 90 days (default)
# Prompts for confirmation with 5-second countdown
bun run scripts/cleanup-notifications.ts

# Delete notifications older than 30 days
bun run scripts/cleanup-notifications.ts --days=30

# Auto-confirm (skip countdown) - useful for CI
bun run scripts/cleanup-notifications.ts --yes

# Dry run with custom threshold
bun run scripts/cleanup-notifications.ts --dry-run --days=60
```

**Example Output:**

```
============================================================
Notification Cleanup Script
============================================================
Mode: LIVE (will delete)
Days threshold: 90
============================================================

⚠️  WARNING: This will permanently delete old notifications!

About to delete 1234 notifications...

Press Ctrl+C to cancel, or wait 5 seconds to continue...

✓ Cleanup completed successfully!
  Deleted: 1234 notifications
  Cutoff date: 2024-08-01T00:00:00.000Z

============================================================
```

### Service Function

For custom integrations, use the service functions directly:

```typescript
import {
  cleanupOldNotifications,
  countOldNotifications,
} from "@/server/services/notification-cleanup"

// Count notifications older than 90 days
const { count, cutoffDate } = await countOldNotifications(90)
console.log(`${count} notifications will be deleted`)

// Delete notifications older than 90 days
const { deletedCount, cutoffDate } = await cleanupOldNotifications(90)
console.log(`Deleted ${deletedCount} notifications`)
```

## Monitoring

### Success Indicators

- API returns `{ "success": true }`
- `deletedCount` matches expected number
- No errors in application logs

### Failure Indicators

- API returns `{ "success": false }` with error message
- 401 Unauthorized - Check CRON_SECRET configuration
- 500 Internal Server Error - Check database connection
- Errors in application logs

### Logging

All cleanup operations log to console:

```
[Notification Cleanup] Starting cleanup for notifications older than 90 days
[Notification Cleanup] Cutoff date: 2024-08-01T00:00:00.000Z
[Notification Cleanup] Successfully deleted 1234 notifications
```

Monitor these logs in:

- **Vercel**: Dashboard → Functions → Logs
- **Local**: Terminal/console output
- **Production**: Your logging service (Sentry, etc.)

## Testing

### Test in Development

1. **Create test notifications:**

```typescript
// In your dev tools console or test script
await createNotification({
  userId: "test-user-id",
  type: "cost_added",
  entityType: "cost",
  entityId: "test-cost-id",
  projectId: "test-project-id",
  message: "Test notification",
})
```

2. **Manually set old timestamp:**

```sql
-- Update notification to be 100 days old
UPDATE notifications
SET created_at = NOW() - INTERVAL '100 days'
WHERE id = 'test-notification-id';
```

3. **Run dry run:**

```bash
bun run scripts/cleanup-notifications.ts --dry-run --days=90
# Should show 1 notification to be deleted
```

4. **Run actual cleanup:**

```bash
bun run scripts/cleanup-notifications.ts --days=90 --yes
# Should delete the test notification
```

### Test API Endpoint

```bash
# Test dry run
curl -X POST \
  -H "Authorization: Bearer YOUR_DEV_CRON_SECRET" \
  http://localhost:3000/api/cron/cleanup-notifications?dryRun=true

# Test count endpoint
curl -H "Authorization: Bearer YOUR_DEV_CRON_SECRET" \
  http://localhost:3000/api/cron/cleanup-notifications
```

## Troubleshooting

### "Cron secret not configured"

**Cause:** `CRON_SECRET` environment variable not set

**Fix:**

```bash
# Add to .env.local
CRON_SECRET="$(openssl rand -base64 32)"

# Restart dev server
```

### "Unauthorized"

**Cause:** Incorrect or missing authorization header

**Fix:**

```bash
# Verify secret matches
echo $CRON_SECRET

# Check request header
curl -v -H "Authorization: Bearer YOUR_SECRET" ...
```

### No notifications deleted

**Cause:** No notifications older than threshold

**Fix:**

```bash
# Check count first
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup-notifications

# Try shorter threshold for testing
curl -X POST \
  -H "Authorization: Bearer YOUR_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup-notifications?days=1
```

### Database connection error

**Cause:** Database unavailable or connection timeout

**Fix:**

- Check database status (Neon console, local PostgreSQL)
- Verify DATABASE_URL environment variable
- Check network connectivity
- Review database logs

## Performance Considerations

### Database Impact

- **Small datasets (<10k notifications)**: Negligible impact, completes in <1s
- **Medium datasets (10k-100k)**: 1-5 seconds, minimal resource usage
- **Large datasets (>100k)**: 5-30 seconds, may require optimization

### Optimization for Large Datasets

If cleanup takes too long:

```typescript
// Batch deletion (add to cleanup service)
async function cleanupInBatches(daysOld = 90, batchSize = 1000) {
  let totalDeleted = 0
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  while (true) {
    const deleted = await db
      .delete(notifications)
      .where(lt(notifications.createdAt, cutoffDate))
      .limit(batchSize)
      .returning({ id: notifications.id })

    if (deleted.length === 0) break
    totalDeleted += deleted.length

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return totalDeleted
}
```

### Recommended Schedule

- **Daily cleanup (recommended)**: `0 2 * * *` (2 AM daily)
- **Weekly cleanup**: `0 2 * * 0` (2 AM Sunday)
- **Monthly cleanup**: `0 2 1 * *` (2 AM 1st of month)

Choose based on notification volume:

- High volume (>1000/day) → Daily
- Medium volume (100-1000/day) → Weekly
- Low volume (<100/day) → Monthly

## Security

- ✅ Requires authentication via bearer token
- ✅ Secret stored in environment variables
- ✅ No user-facing UI (API only)
- ✅ Logs all cleanup operations
- ✅ Supports dry-run mode for safety
- ✅ Returns detailed results for monitoring

**Best Practices:**

- Use strong, randomly generated CRON_SECRET
- Rotate secret periodically (every 90 days)
- Never commit CRON_SECRET to version control
- Use different secrets for dev/staging/production
- Monitor cleanup job execution logs
- Test with dry-run before first production run

## Related

- [Story 8.1: In-App Notification System](./stories/8.1.story.md)
- [Notification API Documentation](../apps/web/src/server/api/routers/notification.ts)
- [Notification Service](../apps/web/src/server/services/notifications.ts)
