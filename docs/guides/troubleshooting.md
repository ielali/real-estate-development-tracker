# Troubleshooting Guide

This guide provides solutions for common issues in the Real Estate Development Tracker.

## Table of Contents

- [Development Environment Issues](#development-environment-issues)
- [Build and Compilation Issues](#build-and-compilation-issues)
- [Database Issues](#database-issues)
- [Authentication and Session Issues](#authentication-and-session-issues)
- [External Service Integration Issues](#external-service-integration-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Getting More Help](#getting-more-help)

## Development Environment Issues

### Port Already in Use

**Problem:** Cannot start development server - port 3000 is already in use.

**Error:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and Kill Process**

   ```bash
   # Find process on port 3000
   lsof -ti:3000

   # Kill the process
   lsof -ti:3000 | xargs kill -9

   # Or use npx
   npx kill-port 3000
   ```

2. **Use Different Port**

   ```bash
   PORT=3001 bun run dev
   ```

3. **Check for Background Processes**

   ```bash
   # List all node processes
   ps aux | grep node

   # Kill specific node process
   kill -9 <process-id>
   ```

### Module Not Found Errors

**Problem:** `Cannot find module '@/components/ui/button'` or similar errors.

**Solutions:**

1. **Reinstall Dependencies**

   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

2. **Clear Next.js Cache**

   ```bash
   rm -rf apps/web/.next
   rm -rf .turbo
   bun run dev
   ```

3. **Restart TypeScript Server (VS Code)**
   - Press `Cmd/Ctrl + Shift + P`
   - Type "TypeScript: Restart TS Server"
   - Press Enter

4. **Check Path Aliases**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

### Hot Reload Not Working

**Problem:** Changes not reflected in browser.

**Solutions:**

1. **Hard Refresh Browser**
   - Chrome/Edge: `Ctrl/Cmd + Shift + R`
   - Firefox: `Ctrl/Cmd + F5`

2. **Restart Dev Server**

   ```bash
   # Stop server (Ctrl+C)
   # Clear cache
   rm -rf apps/web/.next
   # Restart
   bun run dev
   ```

3. **Check File Watchers (Linux)**

   ```bash
   # Increase file watcher limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

4. **Disable Browser Extensions**
   - Some extensions interfere with HMR
   - Try in incognito/private mode

### Bun-Specific Issues

**Problem:** Errors specific to Bun package manager.

**Solutions:**

1. **Update Bun**

   ```bash
   bun upgrade
   ```

2. **Use npm as Fallback**

   ```bash
   npm install
   npm run dev
   ```

3. **Clear Bun Cache**
   ```bash
   rm -rf ~/.bun/install/cache
   bun install
   ```

## Build and Compilation Issues

### TypeScript Errors After Git Pull

**Problem:** Type errors after pulling latest changes.

**Solutions:**

1. **Update Dependencies**

   ```bash
   bun install
   ```

2. **Restart TypeScript**

   ```bash
   # Kill TS server processes
   pkill -f "tsserver"

   # Restart in VS Code
   # Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
   ```

3. **Clean Build**
   ```bash
   rm -rf apps/web/.next
   bun run build
   ```

### Build Fails with Memory Error

**Problem:** `JavaScript heap out of memory` during build.

**Error:**

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node Memory**

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" bun run build
   ```

2. **Add to package.json**

   ```json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

3. **Close Other Applications**
   - Free up system memory
   - Close unused browser tabs

### Linting Errors

**Problem:** ESLint errors preventing commits.

**Solutions:**

1. **Auto-Fix Issues**

   ```bash
   bun run lint --fix
   ```

2. **Check Specific File**

   ```bash
   npx eslint path/to/file.ts
   ```

3. **Temporarily Disable for Line**

   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const data: any = response
   ```

4. **Update ESLint Config**
   ```javascript
   // .eslintrc.js
   module.exports = {
     rules: {
       "rule-name": "off", // or 'warn'
     },
   }
   ```

## Database Issues

### Connection Refused / Can't Connect

**Problem:** Cannot connect to Neon database.

**Error:**

```
Error: Connection refused
Error: SSL connection required
```

**Solutions:**

1. **Check Environment Variable**

   ```bash
   # Verify DATABASE_URL is set
   echo $NETLIFY_DATABASE_URL

   # Ensure SSL mode
   # Should end with: ?sslmode=require
   ```

2. **Verify Neon Database Status**
   - Go to [Neon Console](https://console.neon.tech/)
   - Check database is not paused
   - Check connection string is correct

3. **Test Connection**

   ```bash
   # Using psql
   psql "$NETLIFY_DATABASE_URL"

   # Using Drizzle Studio
   bun run db:studio
   ```

4. **Check Network/Firewall**

   ```bash
   # Test connectivity to Neon
   telnet <neon-host> 5432

   # Or using curl
   curl -v telnet://<neon-host>:5432
   ```

### Migration Failures

**Problem:** Database migration fails during deployment or local development.

**Solutions:**

1. **Check Migration Syntax**

   ```bash
   # Review migration file
   cat apps/web/drizzle/migrations/0001_*.sql

   # Look for syntax errors
   ```

2. **Run Migration Manually**

   ```bash
   # Connect to database
   psql "$NETLIFY_DATABASE_URL"

   # Run migration SQL manually
   \i apps/web/drizzle/migrations/0001_migration.sql
   ```

3. **Reset Migration State**

   ```bash
   # ⚠️ Development only - clears all data
   bun run db:reset

   # Regenerate migrations
   bun run db:generate
   bun run db:migrate
   ```

4. **Check Dependencies**
   - Ensure migrations run in order
   - Check for missing foreign key tables
   - Verify schema changes are valid

### Data Not Appearing

**Problem:** Data saved but not showing in UI.

**Solutions:**

1. **Check Soft Delete**

   ```typescript
   // Ensure query excludes deleted items
   const projects = await db.query.projects.findMany({
     where: isNull(projects.deletedAt),
   })
   ```

2. **Verify Ownership**

   ```typescript
   // Check user owns the data
   const projects = await db.query.projects.findMany({
     where: and(eq(projects.ownerId, userId), isNull(projects.deletedAt)),
   })
   ```

3. **Check React Query Cache**

   ```typescript
   // Invalidate query
   queryClient.invalidateQueries(["projects"])

   // Or refetch
   const { refetch } = api.projects.list.useQuery()
   refetch()
   ```

4. **Inspect Database Directly**
   ```bash
   bun run db:studio
   # Or psql
   psql "$NETLIFY_DATABASE_URL" -c "SELECT * FROM projects;"
   ```

### Slow Queries

**Problem:** Queries taking too long.

**Solutions:**

1. **Add Missing Indexes**

   ```typescript
   // In schema.ts
   export const projects = pgTable(
     "projects",
     {
       // ...
     },
     (table) => ({
       ownerIdx: index("owner_idx").on(table.ownerId),
       statusIdx: index("status_idx").on(table.status),
     })
   )
   ```

2. **Optimize Query**

   ```typescript
   // Bad: N+1 query
   const projects = await db.query.projects.findMany()
   for (const project of projects) {
     const costs = await db.query.costs.findMany({
       where: eq(costs.projectId, project.id),
     })
   }

   // Good: Use with clause
   const projects = await db.query.projects.findMany({
     with: {
       costs: true,
     },
   })
   ```

3. **Use Drizzle EXPLAIN**

   ```typescript
   const result = await db.execute(
     sql`EXPLAIN ANALYZE SELECT * FROM projects WHERE owner_id = ${userId}`
   )
   console.log(result)
   ```

4. **Enable Query Logging**
   ```typescript
   // In db.ts
   const db = drizzle(client, {
     schema,
     logger: true, // Enable logging
   })
   ```

## Authentication and Session Issues

### Session Not Persisting

**Problem:** User logged out on page refresh.

**Solutions:**

1. **Check Cookie Settings**

   ```typescript
   // In auth config
   export const auth = betterAuth({
     secret: process.env.BETTER_AUTH_SECRET,
     baseURL: process.env.BETTER_AUTH_URL,
     session: {
       cookieCache: {
         enabled: true,
         maxAge: 30 * 24 * 60 * 60, // 30 days
       },
     },
   })
   ```

2. **Verify Environment Variables**

   ```bash
   # Must be set correctly
   BETTER_AUTH_SECRET=<32+ character secret>
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Clear Browser Cookies**
   - Open DevTools
   - Application → Cookies
   - Delete all localhost cookies
   - Try login again

4. **Check HTTPS/HTTP Mismatch**
   - Cookies with `secure: true` require HTTPS
   - Use HTTP in development
   - Use HTTPS in production

### Login Failures

**Problem:** Cannot log in with correct credentials.

**Solutions:**

1. **Check Credentials**

   ```bash
   # Verify user exists
   bun run db:studio
   # Check users table
   ```

2. **Reset Password**

   ```bash
   # Connect to database
   psql "$NETLIFY_DATABASE_URL"

   # Update password (development only)
   UPDATE users SET password = '<hashed-password>' WHERE email = 'user@example.com';
   ```

3. **Check Better-auth Logs**

   ```typescript
   // Enable debug logging
   export const auth = betterAuth({
     // ...
     logger: {
       level: "debug",
     },
   })
   ```

4. **Verify Email Format**
   - Ensure lowercase email
   - Trim whitespace
   - Check for typos

### Unauthorized Errors

**Problem:** `UNAUTHORIZED` error on protected routes.

**Solutions:**

1. **Check Session Validation**

   ```typescript
   // In tRPC context
   export const createTRPCContext = async ({ req, res }) => {
     const session = await auth.api.getSession({ headers: req.headers })

     return {
       session,
       user: session?.user,
       db,
     }
   }
   ```

2. **Use Protected Procedure**

   ```typescript
   // Ensure using protectedProcedure
   create: protectedProcedure // Not publicProcedure
     .input(schema)
     .mutation(async ({ ctx, input }) => {
       // ctx.user is guaranteed
     })
   ```

3. **Check Headers**
   ```typescript
   // Ensure cookies sent with request
   const api = createTRPCClient({
     links: [
       httpBatchLink({
         url: "/api/trpc",
         fetch(url, options) {
           return fetch(url, {
             ...options,
             credentials: "include", // Include cookies
           })
         },
       }),
     ],
   })
   ```

## External Service Integration Issues

### Resend Email Not Sending

**Problem:** Emails not being delivered.

**Solutions:**

1. **Check API Key**

   ```bash
   # Verify key is set
   echo $RESEND_API_KEY

   # Test with curl
   curl -X POST 'https://api.resend.com/emails' \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"from":"noreply@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

2. **Verify Domain**
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Ensure domain verified
   - Check DNS records configured

3. **Check Development Mode**

   ```typescript
   // In development, emails log to console
   if (process.env.NODE_ENV === "development") {
     console.log("Email:", email)
     return // Don't actually send
   }
   ```

4. **Review Resend Logs**
   - Check Resend dashboard for delivery status
   - Look for bounces or errors

### Netlify Blobs Upload Failing

**Problem:** File upload errors.

**Solutions:**

1. **Check Token**

   ```bash
   # Verify token set
   echo $BLOB_READ_WRITE_TOKEN
   ```

2. **Verify Blob Configuration**

   ```typescript
   import { put } from "@netlify/blobs"

   const blob = await put("key", data, {
     token: process.env.BLOB_READ_WRITE_TOKEN,
     siteID: process.env.NETLIFY_SITE_ID,
   })
   ```

3. **Check File Size Limits**
   - Netlify Blobs has size limits
   - Check file size before upload
   - Implement chunked upload for large files

4. **Test Locally**

   ```bash
   # Use Netlify Dev
   netlify dev

   # Blobs work in local dev mode
   ```

### Google Maps Autocomplete Not Working

**Problem:** Address autocomplete doesn't show suggestions.

**Solutions:**

1. **Check API Key**

   ```bash
   # Verify key is set (client-side)
   echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

2. **Enable Required APIs**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API
   - Enable Places API

3. **Check API Restrictions**
   - Verify HTTP referrer restrictions
   - Add `localhost:3000` for development
   - Add production domain

4. **Check Console for Errors**
   ```javascript
   // Open browser DevTools
   // Look for Google Maps errors
   // Common: "This API key is not authorized..."
   ```

## Deployment Issues

### Build Failing on Netlify

**Problem:** Build succeeds locally but fails on Netlify.

**Solutions:**

1. **Check Environment Variables**
   - Verify all required vars set in Netlify
   - Match variable names exactly
   - Check for typos

2. **Check Node Version**

   ```toml
   # netlify.toml
   [build.environment]
     NODE_VERSION = "18"
   ```

3. **Review Build Logs**
   - Go to Netlify dashboard → Deploys
   - Click failed deploy
   - Check error message

4. **Test Build Locally**

   ```bash
   # Use exact build command
   cd apps/web && bun run db:migrate && bun run build

   # Test production build
   bun run start
   ```

### Runtime Errors in Production

**Problem:** App works locally but errors in production.

**Solutions:**

1. **Check Environment Variables**
   - Ensure production values set
   - Verify database URL points to production

2. **Enable Error Logging**

   ```typescript
   // Add error boundary
   export default function GlobalError({
     error,
   }: {
     error: Error & { digest?: string };
   }) {
     console.error('Global error:', error);
     return <html>...</html>;
   }
   ```

3. **Check Netlify Function Logs**
   - Netlify dashboard → Functions
   - View function logs
   - Look for errors

4. **Test with Production Build**

   ```bash
   # Build for production
   bun run build

   # Run production server
   bun run start
   ```

### Slow Performance in Production

**Problem:** App slow in production but fast locally.

**Solutions:**

1. **Check Neon Database Region**
   - Ensure database in optimal region
   - Consider read replicas

2. **Optimize Bundle Size**

   ```bash
   # Analyze bundle
   npm run build -- --analyze

   # Check for large dependencies
   ```

3. **Enable Caching**

   ```typescript
   // Add cache headers
   export const dynamic = "force-static"
   export const revalidate = 3600 // 1 hour
   ```

4. **Use Netlify Analytics**
   - Check Core Web Vitals
   - Identify slow pages
   - Review waterfall charts

## Performance Issues

### Slow Page Loads

**Problem:** Pages take too long to load.

**Solutions:**

1. **Use React DevTools Profiler**
   - Install React DevTools
   - Record interaction
   - Identify slow components

2. **Implement Code Splitting**

   ```typescript
   // Use dynamic imports
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />
   });
   ```

3. **Optimize Images**

   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';

   <Image
     src="/image.jpg"
     width={500}
     height={300}
     alt="Description"
   />
   ```

4. **Add Loading States**
   ```typescript
   // Use Suspense
   <Suspense fallback={<Loading />}>
     <AsyncComponent />
   </Suspense>
   ```

### Memory Leaks

**Problem:** Browser slows down over time.

**Solutions:**

1. **Check Event Listeners**

   ```typescript
   useEffect(() => {
     const handler = () => {
       /* ... */
     }
     window.addEventListener("resize", handler)

     // Cleanup!
     return () => window.removeEventListener("resize", handler)
   }, [])
   ```

2. **Cancel Requests**

   ```typescript
   useEffect(() => {
     const controller = new AbortController()

     fetch(url, { signal: controller.signal })

     return () => controller.abort()
   }, [])
   ```

3. **Clear Intervals/Timeouts**

   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       /* ... */
     }, 1000)

     return () => clearInterval(interval)
   }, [])
   ```

4. **Use Chrome Memory Profiler**
   - DevTools → Memory
   - Take heap snapshot
   - Compare snapshots
   - Identify retained objects

## Getting More Help

### Self-Help Resources

1. **Search Documentation**
   - [Local Development Guide](./local-development.md)
   - [Testing Guide](./testing.md)
   - [Deployment Guide](./deployment.md)
   - [Architecture Overview](../../ARCHITECTURE.md)

2. **Check Logs**

   ```bash
   # Development logs
   # Check terminal output

   # Production logs
   # Netlify dashboard → Functions → Logs
   ```

3. **Search GitHub Issues**
   - [Project Issues](https://github.com/your-org/realestate-portfolio/issues)
   - Search for similar problems
   - Check closed issues

### Getting Support

1. **Create GitHub Issue**

   ```markdown
   **Problem:**
   Brief description

   **Steps to Reproduce:**

   1. Step one
   2. Step two

   **Expected Behavior:**
   What should happen

   **Actual Behavior:**
   What actually happens

   **Environment:**

   - OS: macOS/Windows/Linux
   - Node version: 18.x
   - Bun version: 1.x
   - Browser: Chrome 120

   **Logs:**
   ```

   Paste relevant error messages

   ```

   ```

2. **GitHub Discussions**
   - For questions and discussions
   - Get help from community
   - Share knowledge

3. **External Resources**
   - [Next.js Discord](https://discord.gg/nextjs)
   - [tRPC Discord](https://discord.gg/trpc)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/nextjs)

### Emergency Contacts

For production emergencies:

1. **Immediate Actions**
   - Rollback deployment (see [Deployment Guide](./deployment.md#rollback-procedures))
   - Check monitoring dashboards
   - Review recent changes

2. **Incident Response**
   - Document the issue
   - Notify team
   - Create post-mortem after resolution

---

**Still stuck?** Create a GitHub issue with detailed information about your problem.
