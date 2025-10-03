# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**

- **Platform:** Netlify (optimized for Next.js)
- **Build Command:** `cd apps/web && bun run db:migrate && bun run build`
- **Publish Directory:** `apps/web/.next`
- **Base Directory:** `/` (root)
- **CDN/Edge:** Netlify Edge Network with automatic optimization

**Backend Deployment:**

- **Platform:** Netlify Serverless Functions (Next.js API routes)
- **Build Command:** Same as frontend (integrated)
- **Deployment Method:** Git-based automatic deployment

**Database Deployment:**

- **All Environments:** Neon PostgreSQL (serverless PostgreSQL)
- **Development:** Neon database instance (each developer has own instance)
- **Production:** Neon database via Netlify integration (auto-configured via NETLIFY_DATABASE_URL)
- **Migrations:** Automated via Drizzle Kit in build process (`bun run db:migrate`)

## CI/CD Pipeline

**GitHub Actions (CI Only):**

```yaml
name: CI Pipeline
on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: npm rebuild better-sqlite3
      - run: bun run type-check
      - run: bun run lint
      - run: bun run test
        env:
          NODE_ENV: test
          DATABASE_URL: file:./test.db
          BETTER_AUTH_SECRET: test-secret-key
          DEPLOY_PRIME_URL: http://localhost:3000
      - run: bun run build
        env:
          NODE_ENV: production
          DATABASE_URL: file:./build.db
          BETTER_AUTH_SECRET: build-secret-key
          DEPLOY_PRIME_URL: https://example.com
```

**Netlify (Automatic Deployment):**

- Deployment is handled automatically by Netlify's built-in CI/CD
- Triggers on push to `main` branch (production) or any branch (preview)
- Uses configuration from `netlify.toml`
- No GitHub Actions deployment workflow needed

## Environments

| Environment | Frontend URL                             | Backend URL               | Database                       | Purpose           |
| ----------- | ---------------------------------------- | ------------------------- | ------------------------------ | ----------------- |
| Development | http://localhost:3000                    | http://localhost:3000/api | Neon PostgreSQL (dev instance) | Local development |
| Preview     | https://[branch]-[site-name].netlify.app | Same (integrated)         | Neon PostgreSQL (preview)      | PR previews       |
| Production  | https://[site-name].netlify.app          | Same (integrated)         | Neon PostgreSQL (production)   | Live environment  |

## Netlify Configuration

Configuration is defined in `netlify.toml`:

```toml
[build]
  command = "cd apps/web && bun run db:migrate && bun run build"
  publish = "apps/web/.next"
  base = "/"

[build.environment]
  NODE_VERSION = "22"

[context.production]
  command = "cd apps/web && bun run db:migrate && bun run build"

[context.deploy-preview]
  command = "cd apps/web && bun run db:migrate && bun run build"

[context.branch-deploy]
  command = "cd apps/web && bun run db:migrate && bun run build"
```

## Database Strategy

**Neon PostgreSQL (All Environments):**

- Serverless PostgreSQL used for development and production
- Each developer maintains their own Neon database instance
- Production uses Neon database integrated via Netlify
- Connection via `NETLIFY_DATABASE_URL` environment variable

**Migration Strategy:**

- Migrations run automatically during build process
- Uses Drizzle Kit: `bun run db:migrate`
- Same migrations work across all environments
- Drizzle ORM automatically uses Neon serverless driver

## File Storage

**Netlify Blobs:**

- Integrated blob storage for documents and photos
- Automatically configured in Netlify dashboard
- Token auto-injected via `NETLIFY_BLOBS_CONTEXT`
- CDN-backed for fast delivery

## Environment Variables

**Development (.env.local):**

```bash
NODE_ENV=development
DEPLOY_PRIME_URL=http://localhost:3000
NETLIFY_DATABASE_URL=postgresql://[user]:[pass]@[host].neon.tech/[db]?sslmode=require
BETTER_AUTH_SECRET=dev-secret-minimum-32-chars-long
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**Production (Netlify Dashboard):**

```bash
NODE_ENV=production
DEPLOY_PRIME_URL=https://[site-name].netlify.app
NETLIFY_DATABASE_URL=[auto-configured-by-neon-integration]
BETTER_AUTH_SECRET=[production-secret-32-chars]
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
BLOB_READ_WRITE_TOKEN=[auto-injected]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXX
```

## Deployment Workflow

**Automatic Deployment:**

1. Developer pushes code to GitHub
2. GitHub Actions runs CI pipeline (type-check, lint, test, build)
3. If push to `main` branch, Netlify automatically deploys to production
4. If push to other branch, Netlify creates preview deployment
5. Database migrations run automatically during build
6. New deployment goes live

**Manual Deployment (via CLI):**

```bash
# Install Netlify CLI
bun install -g netlify-cli

# Login and link site
netlify login
netlify link

# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Monitoring & Analytics

**Netlify Analytics:**

- Server-side analytics (no JavaScript required)
- Page views, unique visitors, bandwidth tracking
- Available on Netlify Pro plan and above

**Netlify Speed Insights:**

- Core Web Vitals monitoring
- Performance metrics for optimization
- Real user monitoring (RUM)

**Error Tracking:**

- Sentry integration (planned for future)
- Runtime error monitoring
- Performance tracking

## Security

**Netlify Security Features:**

- Automatic HTTPS certificates
- DDoS protection via Netlify Edge
- Secure environment variable storage
- Branch-specific environment variables

**Database Security:**

- Neon PostgreSQL uses SSL/TLS encryption
- Connection pooling for efficiency
- Automatic backups and point-in-time recovery

## Rollback Strategy

**Netlify Dashboard:**

1. Go to Deploys tab
2. Find last working deployment
3. Click "Publish deploy" to rollback

**Netlify CLI:**

```bash
# List recent deployments
netlify deploy:list

# Restore specific deployment
netlify deploy:restore [deploy-id]
```

**Git Revert:**

```bash
# Revert to previous commit
git revert [commit-hash]
git push origin main
```

## Performance Optimization

**Build Performance:**

- Bun package manager for faster installs
- Netlify build caching for dependencies
- Incremental builds where possible
- Turborepo for monorepo optimization

**Runtime Performance:**

- Netlify Edge Network CDN
- Next.js automatic code splitting
- Serverless function optimization
- PostgreSQL connection pooling via Neon

**Database Performance:**

- Neon serverless autoscaling
- Connection pooling built-in
- Regional deployment for low latency
- Automatic query optimization
