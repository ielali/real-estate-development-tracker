# Netlify Function Logging Diagnostic Guide

## Problem

Not seeing any console.log or console.error output from Next.js API routes deployed to Netlify.

## Where Netlify Function Logs Actually Are

### ❌ NOT in Build Logs

Build logs show the compilation process, NOT runtime function execution.

### ✅ In Function Logs (Real-time)

**Method 1: Netlify Dashboard - Real-time Logs**

1. Go to https://app.netlify.com
2. Select your site
3. In left sidebar, click **"Logs"** (not "Deploys")
4. Click on **"Functions"** tab at the top
5. You should see real-time function invocations
6. Click on any invocation to see detailed logs

**Method 2: Site Settings - Function Logs**

1. Go to your site in Netlify Dashboard
2. Click **"Site configuration"** (or "Site settings")
3. In left sidebar under "Functions", click **"Functions"**
4. You'll see a list of deployed functions
5. Click on any function name to see invocation logs

**Method 3: Netlify CLI - Live Tail**

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Link your local project to Netlify site
netlify link

# Stream function logs in real-time
netlify functions:log

# Or tail all logs
netlify logs:function
```

**Method 4: Deploy-specific Logs**

1. Go to **"Deploys"** tab
2. Click on the specific deploy
3. Scroll down past build logs
4. Look for **"Function logs"** section (appears AFTER build completes)

## Quick Test

### Step 1: Deploy the test endpoint

```bash
git add apps/web/src/pages/api/test-logging.ts
git commit -m "Add logging test endpoint"
git push origin feature/story-9.1
```

### Step 2: Wait for deploy to complete

### Step 3: Call the test endpoint

Visit in browser:

```
https://your-preview-url.netlify.app/api/test-logging
```

### Step 4: Check logs IMMEDIATELY

Run this command in terminal:

```bash
netlify functions:log
```

OR go to Netlify Dashboard → Logs → Functions tab (refresh page)

## Expected Output

You should see something like:

```
✅ [LOG] Test logging endpoint called at 2025-11-05T...
✅ [ERROR] Test logging endpoint called at 2025-11-05T...
✅ [WARN] Test logging endpoint called at 2025-11-05T...
Environment: { NODE_ENV: 'production', CONTEXT: 'production', ... }
```

## If You STILL Don't See Logs

### Check 1: Verify function is deploying

```bash
netlify functions:list
```

Should show `___netlify-handler` or similar Next.js functions

### Check 2: Verify function is being called

- Check browser Network tab
- Verify API route returns 200 OK
- Check response body for success message

### Check 3: Netlify Plan Limitations

Some Netlify plans have limited function log retention:

- **Free tier**: Logs retained for 1 hour
- **Pro tier**: Logs retained for 7 days
- **Business tier**: Logs retained for 30 days

### Check 4: Function Log Level

Add this to `netlify.toml`:

```toml
[functions]
  # ... existing config

  [functions.environment]
    NODE_OPTIONS = "--trace-warnings"
```

### Check 5: Use Netlify's Built-in Logger

Replace console.log with Netlify's logger:

```typescript
// In your API route
import { schedule } from "@netlify/functions"

// Use structured logging
console.log(
  JSON.stringify({
    level: "info",
    message: "PDF generation started",
    timestamp: new Date().toISOString(),
  })
)
```

## Alternative: Use External Logging Service

If Netlify logs are unreliable, consider:

### Option 1: Axiom (Free tier available)

```bash
npm install next-axiom
```

### Option 2: LogTail (Free tier available)

```bash
npm install @logtail/node
```

### Option 3: Simple HTTP logging to external service

```typescript
// Send logs to your own endpoint
fetch("https://your-log-collector.com/log", {
  method: "POST",
  body: JSON.stringify({ message: "PDF generation started" }),
}).catch(() => {}) // Fail silently
```

## Debugging Checklist

- [ ] Deployed latest code with logging
- [ ] Triggered the API endpoint
- [ ] Checked Netlify Dashboard → Logs → Functions (refreshed page)
- [ ] Tried `netlify functions:log` in terminal
- [ ] Verified function is in function list (`netlify functions:list`)
- [ ] Checked function execution in browser Network tab
- [ ] Waited at least 30 seconds for logs to appear
- [ ] Checked correct site (preview vs production)
- [ ] Verified not looking at build logs (common mistake)

## Next Steps

1. Deploy and test `/api/test-logging` endpoint
2. Verify you can see those logs
3. If test endpoint logs work, PDF generation logs should too
4. If test endpoint logs DON'T work, there's a deeper Netlify configuration issue
