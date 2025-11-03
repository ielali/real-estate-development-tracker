# Email Digest Cron Jobs

**Story 8.2** - AC #8, #9, #12: Automated digest email processing

This document describes the implementation of automated email digest processing using Netlify Scheduled Functions.

## Overview

The digest cron job system automatically processes and sends daily and weekly email digests to users based on their notification preferences. It consists of:

1. **Processing Script**: `apps/web/scripts/process-digests.ts` - Core logic for querying, grouping, and sending digests
2. **Scheduled Functions**: `netlify/functions/{daily,weekly}-digest.mts` - Netlify cron jobs that trigger the script
3. **NPM Scripts**: Convenient commands for manual testing and invocation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Scheduler                         │
│                                                              │
│  Daily (8 AM UTC)          Weekly (Mon 8 AM UTC)            │
│         │                            │                       │
└─────────┼────────────────────────────┼───────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Netlify Scheduled Functions                     │
│                                                              │
│  daily-digest.mts          weekly-digest.mts                │
│  (executes script)         (executes script)                │
└─────────┬────────────────────────────┬───────────────────────┘
          │                            │
          └────────────┬───────────────┘
                       ▼
          ┌─────────────────────────────┐
          │  process-digests.ts         │
          │  --type daily|weekly        │
          └─────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    ┌──────────┐            ┌──────────┐
    │ Database │            │  Resend  │
    │  Query   │            │   API    │
    └──────────┘            └──────────┘
```

## Schedule

### Daily Digest

- **Cron**: `0 8 * * *` (Every day at 8:00 AM UTC)
- **Function**: `netlify/functions/daily-digest.mts`
- **Targets**: Users with `emailDigestFrequency = 'daily'`
- **Content**: Notifications from the past 24 hours

### Weekly Digest

- **Cron**: `0 8 * * 1` (Every Monday at 8:00 AM UTC)
- **Function**: `netlify/functions/weekly-digest.mts`
- **Targets**: Users with `emailDigestFrequency = 'weekly'`
- **Content**: Notifications from the past 7 days

## Processing Logic

### 1. Query Phase

```typescript
// Find all digest queue items ready to send
SELECT dq.*, u.email, u.name, p.name as projectName
FROM digest_queue dq
JOIN users u ON dq.userId = u.id
JOIN notification_preferences np ON u.id = np.userId
JOIN projects p ON dq.projectId = p.id
WHERE dq.processed = false
  AND dq.scheduledFor <= NOW()
  AND np.emailDigestFrequency = 'daily'|'weekly'
```

### 2. Grouping Phase

Notifications are grouped by:

1. User (one email per user)
2. Project (sections within each email)

```typescript
interface GroupedDigest {
  userId: string
  userName: string
  userEmail: string
  digestType: "daily" | "weekly"
  notifications: DigestNotification[]
  projectGroups: Map<string, DigestNotification[]>
}
```

### 3. Email Generation Phase

For each user:

- Generate unsubscribe token (JWT with 90-day expiry)
- Build HTML email with:
  - User-friendly greeting
  - Project-grouped notifications
  - Direct links to each entity
  - Unsubscribe link

### 4. Sending Phase

- Send emails in batches of 100
- Use Resend API for delivery
- Include retry logic (3 attempts with exponential backoff)
- Log all attempts to `email_logs` table

### 5. Cleanup Phase

- Mark processed queue items as `processed = true`
- Log completion statistics

## Files

### Scheduled Functions

**Location**: `netlify/functions/`

| File                | Schedule    | Description              |
| ------------------- | ----------- | ------------------------ |
| `daily-digest.mts`  | `0 8 * * *` | Processes daily digests  |
| `weekly-digest.mts` | `0 8 * * 1` | Processes weekly digests |

### Processing Script

**Location**: `apps/web/scripts/process-digests.ts`

**CLI Arguments**:

- `--type daily` - Process daily digests only
- `--type weekly` - Process weekly digests only
- `--type all` - Process both daily and weekly digests

### NPM Scripts

**Location**: `apps/web/package.json`

```json
{
  "scripts": {
    "digest:daily": "bun run scripts/process-digests.ts --type daily",
    "digest:weekly": "bun run scripts/process-digests.ts --type weekly",
    "digest:all": "bun run scripts/process-digests.ts --type all"
  }
}
```

## Manual Testing

### Test Daily Digest

```bash
cd apps/web
bun run digest:daily
```

### Test Weekly Digest

```bash
cd apps/web
bun run digest:weekly
```

### Test All Digests

```bash
cd apps/web
bun run digest:all
```

## Deployment

### Automatic Deployment

Scheduled functions are automatically deployed when:

1. Code is pushed to the main branch
2. Netlify build completes successfully
3. Functions are detected in `netlify/functions/` directory

### Verification

After deployment, verify in Netlify dashboard:

1. Go to **Functions** tab
2. Find `daily-digest` and `weekly-digest`
3. Check **Next Invocation** time
4. Review **Recent Invocations** log

## Monitoring

### Netlify Dashboard

**Location**: Netlify Dashboard > Functions > [function-name]

**Metrics Available**:

- Invocation count
- Success/failure rate
- Execution duration
- Error logs
- Next scheduled run

### Database Logs

**Table**: `email_logs`

```sql
-- Check recent digest email attempts
SELECT * FROM email_logs
WHERE email_type LIKE '%digest%'
ORDER BY sent_at DESC
LIMIT 20;

-- Check failed digest emails
SELECT * FROM email_logs
WHERE email_type LIKE '%digest%'
  AND status = 'failed'
ORDER BY sent_at DESC;
```

### Function Logs

Each function logs:

- Start timestamp
- Execution duration
- Number of digests sent
- Success/failure status
- Any errors encountered

## Environment Variables

Required environment variables (set in Netlify dashboard):

| Variable               | Description                           |
| ---------------------- | ------------------------------------- |
| `NETLIFY_DATABASE_URL` | Production database connection string |
| `RESEND_API_KEY`       | Resend API key for sending emails     |
| `BETTER_AUTH_SECRET`   | JWT secret for unsubscribe tokens     |
| `NEXT_PUBLIC_APP_URL`  | Base URL for email links              |

## Troubleshooting

### Functions Not Running

**Symptoms**: No emails being sent, no function invocations in logs

**Solutions**:

1. Check Netlify Function logs for errors
2. Verify schedule format is correct in function config
3. Ensure functions are in `netlify/functions/` directory
4. Verify environment variables are set in Netlify dashboard
5. Check that the repository is deployed on Netlify

### Database Connection Errors

**Symptoms**: "Failed to connect to database" errors

**Solutions**:

1. Verify `NETLIFY_DATABASE_URL` is set correctly
2. Check database is accessible from Netlify servers
3. Ensure database connection limits are not exceeded
4. Verify database credentials are valid

### Email Sending Failures

**Symptoms**: Emails not delivered, "failed" status in email_logs

**Solutions**:

1. Verify `RESEND_API_KEY` is valid and active
2. Check Resend dashboard for rate limits
3. Review `email_logs` table for specific error messages
4. Ensure recipient email addresses are valid
5. Check Resend domain verification status

### Timeouts

**Symptoms**: Function times out before completion

**Solutions**:

1. Reduce batch size in process-digests.ts
2. Implement pagination for large datasets
3. Optimize database queries with proper indexes
4. Consider splitting processing across multiple invocations

## Performance Considerations

### Current Limits

- Netlify Function timeout: 10 seconds (free tier), 26 seconds (paid)
- Resend rate limit: 100 emails/second
- Database connection pool: 10 connections (Neon free tier)

### Optimization Strategies

1. **Batch Processing**: Send emails in batches of 100
2. **Connection Pooling**: Reuse database connections
3. **Query Optimization**: Use proper indexes on `digest_queue` and `notification_preferences`
4. **Parallel Processing**: Consider using Netlify Background Functions for longer processing

## Future Enhancements

### 1. Timezone-Aware Scheduling

**Current**: All users receive digests at 8 AM UTC

**Proposed**: Send digests at 8 AM in each user's timezone

**Implementation**:

```typescript
// Run hourly instead of daily
schedule: "0 * * * *"

// Filter users by timezone
const currentHour = new Date().getUTCHours()
const targetTimezones = getTimezonesAtHour(currentHour, 8)
WHERE np.timezone IN (targetTimezones)
```

### 2. Digest Preview

Allow users to preview their digest before it's sent:

- Add `GET /api/digest/preview` endpoint
- Show what notifications will be included
- Allow manual trigger

### 3. Digest Analytics

Track digest engagement:

- Email open rates
- Link click rates
- Unsubscribe rates
- A/B testing different digest formats

### 4. Smart Batching

Dynamically adjust batch size based on:

- Function execution time
- Database load
- Email sending rate

## Related Documentation

- [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/)
- [Story 8.2: Email Notifications](./stories/8.2.story.md)
- [Email Templates](../apps/web/src/lib/email-templates/)
- [Digest Queue Schema](../apps/web/src/server/db/schema/digest_queue.ts)

## Support

For issues or questions:

1. Check Netlify Function logs
2. Review `email_logs` table
3. Consult this documentation
4. Contact the development team
