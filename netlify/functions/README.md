# Netlify Scheduled Functions

This directory contains Netlify Scheduled Functions for automated background tasks.

## Functions

### `daily-digest.mts`

Processes and sends daily digest emails to users who have `emailDigestFrequency='daily'`.

- **Schedule**: Daily at 8:00 AM UTC (`0 8 * * *`)
- **Script**: `apps/web/scripts/process-digests.ts --type daily`
- **Story**: 8.2 - AC #8, #12

### `weekly-digest.mts`

Processes and sends weekly digest emails to users who have `emailDigestFrequency='weekly'`.

- **Schedule**: Every Monday at 8:00 AM UTC (`0 8 * * 1`)
- **Script**: `apps/web/scripts/process-digests.ts --type weekly`
- **Story**: 8.2 - AC #9, #12

## How It Works

1. Netlify automatically invokes these functions based on the cron schedule
2. Each function executes the `process-digests.ts` script with the appropriate type
3. The script:
   - Queries the `digest_queue` for users with matching digest frequency
   - Groups notifications by user and project
   - Sends HTML digest emails via Resend
   - Logs email attempts to `email_logs` table
   - Marks queue items as processed

## Deployment

Scheduled functions are automatically deployed when pushed to Netlify. The schedule is defined in the `config` export of each function.

## Testing

### Manual Invocation

You can manually trigger the digest processing locally:

```bash
# Test daily digest processing
cd apps/web
bun run scripts/process-digests.ts --type daily

# Test weekly digest processing
bun run scripts/process-digests.ts --type weekly

# Process all pending digests
bun run scripts/process-digests.ts --type all
```

### Testing Scheduled Functions Locally

Netlify CLI allows testing scheduled functions locally:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Test the daily digest function
netlify functions:invoke daily-digest

# Test the weekly digest function
netlify functions:invoke weekly-digest
```

## Monitoring

- Check Netlify Function logs in the Netlify dashboard under Functions > [function-name]
- Function execution logs include:
  - Start timestamp
  - Execution duration
  - Number of digests sent
  - Success/failure status
  - Any errors encountered

## Future Enhancements

### Timezone-Aware Scheduling

Currently, digests are sent at 8:00 AM UTC to all users. Future enhancement could include:

1. **Hourly Execution**: Run the digest processor every hour
2. **Timezone Filtering**: Only send to users whose timezone is currently 8:00 AM
3. **Implementation**:

   ```typescript
   // In process-digests.ts
   const currentHour = new Date().getUTCHours()
   const targetTimezones = getTimezonesAtHour(currentHour, 8) // Timezones where it's 8 AM

   // Filter users by timezone
   WHERE timezone IN (targetTimezones)
   ```

### Batch Processing

For large user bases, consider:

- Processing digests in batches to avoid timeouts
- Implementing a queue-based system with retry logic
- Splitting processing across multiple function invocations

## Dependencies

- `@netlify/functions` - For scheduled function types (already in devDependencies)
- Bun runtime - For executing the process-digests.ts script
- Environment variables must be configured in Netlify dashboard

## Environment Variables

Ensure these are set in Netlify dashboard:

- `NETLIFY_DATABASE_URL` - Production database connection string
- `RESEND_API_KEY` - Resend API key for sending emails
- `BETTER_AUTH_SECRET` - For JWT token generation (unsubscribe links)
- `NEXT_PUBLIC_APP_URL` - Base URL for email links

## Troubleshooting

### Function Not Running

1. Check Netlify Function logs for errors
2. Verify the schedule format is correct
3. Ensure environment variables are set
4. Check that the repository branch is deployed

### Database Connection Errors

- Verify `NETLIFY_DATABASE_URL` is set correctly
- Check database is accessible from Netlify's servers
- Ensure database connection limits are not exceeded

### Email Sending Failures

- Verify `RESEND_API_KEY` is valid
- Check Resend dashboard for rate limits
- Review email_logs table for detailed error messages
