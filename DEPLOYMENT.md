# Deployment Guide

Complete guide for deploying the Real Estate Development Tracker to production using Netlify.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Netlify Project Setup](#netlify-project-setup)
- [GitHub Actions Configuration](#github-actions-configuration)
- [External Services Setup](#external-services-setup)
- [Environment Variables](#environment-variables)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with repository access
- [ ] Netlify account (free tier works)
- [ ] Resend account (for email service)
- [ ] Node.js 22+ and Bun installed locally
- [ ] All tests passing locally (`bun run test`)
- [ ] Build succeeds locally (`bun run build`)

## Quick Start

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd realestate-portfolio
bun install

# 2. Set up local environment
cp .env.example .env.local
# Edit .env.local with your development values

# 3. Test locally
bun run dev
bun run test
bun run build

# 4. Deploy to Netlify (see detailed steps below)
```

## Netlify Project Setup

### Step 1: Create Netlify Site

1. **Sign in to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with your GitHub account

2. **Import Repository**
   - Click "Add new site" → "Import an existing project"
   - Select GitHub as your Git provider
   - Authorize Netlify to access your repositories
   - Select your repository

3. **Configure Build Settings**

   Netlify will auto-detect settings from `netlify.toml`, but verify:

   ```
   Base directory: (leave empty or set to root)
   Build command: cd apps/web && bun run build
   Publish directory: apps/web/.next
   Functions directory: apps/web/.netlify/functions
   ```

4. **Configure Environment Variables**
   - Click "Site settings" → "Environment variables"
   - Add all required variables (see [Environment Variables](#environment-variables))
   - Set variables for both Production and Deploy Previews

5. **Deploy**
   - Click "Deploy site"
   - Wait for initial deployment to complete
   - Note your deployment URL (e.g., `https://your-site.netlify.app`)

### Step 2: Configure Deployment Settings

1. **Git Integration**
   - Go to Site settings → Build & deploy → Continuous deployment
   - Production branch is set to `main` by default
   - Deploy previews are enabled for all pull requests
   - Configure branch protection rules in GitHub (optional)

2. **Domains** (Optional - Production)
   - Go to Site settings → Domain management
   - Add custom domain if available
   - Configure DNS records as instructed
   - Netlify provides free HTTPS certificates

## GitHub Actions Configuration

### Step 1: Set Up GitHub Secrets (Optional)

If you want to use GitHub Actions for deployment:

1. **Get Netlify Credentials**

   ```bash
   # Install Netlify CLI
   bun install -g netlify-cli

   # Login and link site
   netlify login
   cd /path/to/project
   netlify link

   # Get site ID from .netlify/state.json
   # Get auth token from: netlify.com/user/applications/personal
   ```

2. **Add GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     ```
     NETLIFY_AUTH_TOKEN=<your-netlify-auth-token>
     NETLIFY_SITE_ID=<your-site-id>
     ```

**Note:** Netlify has excellent built-in CI/CD, so GitHub Actions may not be necessary.

### Step 2: Verify Workflows

The repository includes two GitHub Actions workflows:

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Runs on: Push to any branch, PRs to main/develop
   - Actions: Type-check, lint, test, build
   - Purpose: Ensure code quality before merge

2. **`.github/workflows/deploy.yml`** - Deployment (Optional)
   - Runs on: Push to main branch (manual trigger available)
   - Actions: Build and deploy to Netlify production
   - Purpose: Automated production deployments
   - **Note:** Netlify's built-in CI/CD is recommended instead

**Test CI Workflow:**

```bash
# Push a test commit to trigger CI
git checkout -b test/ci-check
git commit --allow-empty -m "test: trigger CI"
git push origin test/ci-check

# Check Actions tab in GitHub to verify workflow runs
```

## External Services Setup

### Neon Database (PostgreSQL for Netlify)

1. **Automatic Integration via Netlify**
   - Go to Netlify Dashboard → Your Site → Integrations
   - Search for "Neon" and click "Enable"
   - Netlify automatically provisions a Neon PostgreSQL database
   - Environment variable `NETLIFY_DATABASE_URL` is automatically set

2. **Manual Setup (if needed)**
   - Create account at [neon.tech](https://neon.tech)
   - Create a new PostgreSQL database
   - Copy the connection string
   - Add to Netlify: `NETLIFY_DATABASE_URL=<connection-string>`

3. **Database Migrations**
   - Migrations run automatically during build (see `netlify.toml`)
   - Build command: `bun run db:migrate && bun run build`
   - Migrations detect environment and use correct database

4. **Local vs Production**
   - **Local Development:** Uses SQLite (`DATABASE_URL=file:./data/dev.db`)
   - **Netlify Deployments:** Uses Neon PostgreSQL (`NETLIFY_DATABASE_URL`)
   - Drizzle ORM automatically switches between dialects

### Resend (Email Service)

1. **Create Resend Account**
   - Go to [resend.com](https://resend.com)
   - Sign up for free account

2. **Get API Key**
   - Dashboard → API Keys
   - Click "Create API Key"
   - Name: "Production" or "Real Estate Tracker"
   - Copy the key immediately (shown only once)

3. **Verify Domain** (Production)
   - Dashboard → Domains
   - Add your domain
   - Configure DNS records as instructed
   - Wait for verification

4. **For Development**
   - Use default sender: `onboarding@resend.dev`
   - No domain verification needed

5. **Test Email Sending**
   ```bash
   # Set RESEND_API_KEY in .env.local
   # Test from your application or use Resend dashboard
   ```

### Netlify Blobs (File Storage)

1. **Enable Netlify Blobs**
   - Netlify Dashboard → Your Site → Integrations
   - Search for "Netlify Blobs" or go to Storage tab
   - Click "Enable" or "Connect"
   - Follow setup wizard

2. **Get Token**
   - After creation, the token is automatically available via environment variables
   - `NETLIFY_BLOBS_CONTEXT` is automatically injected
   - Or manually set `BLOB_READ_WRITE_TOKEN` for compatibility

3. **Storage Configuration**
   - Netlify Blobs provides CDN-backed object storage
   - Automatically configured for serverless functions
   - Supports large file uploads for construction documents and photos

## Environment Variables

### Required Variables

Set these in both Netlify Dashboard and `.env.local`:

#### Production (Netlify Dashboard)

```bash
# Application
NODE_ENV=production
DEPLOY_PRIME_URL=https://your-site.netlify.app

# Database (Neon PostgreSQL - automatically provided by Netlify)
# NETLIFY_DATABASE_URL is automatically set by Netlify when you connect a Neon database
# No manual configuration needed for DATABASE_URL in production

# Authentication
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@your-domain.com

# File Storage (Netlify Blobs or alternative service)
BLOB_READ_WRITE_TOKEN=<your-blob-token-or-cloudinary-url>

# Google Maps (if using address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXX
```

#### Development (`.env.local`)

```bash
# Application
NODE_ENV=development
DEPLOY_PRIME_URL=http://localhost:3000

# Database
DATABASE_URL=file:./data/dev.db

# Authentication
BETTER_AUTH_SECRET=dev-secret-minimum-32-chars-long

# Email Service (use test key or leave empty for console logging)
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

# File Storage (optional for local dev)
BLOB_READ_WRITE_TOKEN=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-dev-api-key
```

### How to Set Variables in Netlify

1. Go to Netlify Dashboard → Your Site
2. Site settings → Environment variables
3. Add each variable:
   - Click "Add a variable"
   - Key: Variable name (e.g., `RESEND_API_KEY`)
   - Value: Variable value
   - Scopes: Select Deploy contexts (Production, Deploy Previews, Branch deploys)
4. Click "Create variable"
5. Trigger a new deploy for changes to take effect

### Generating Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Process

### Automatic Deployment (Recommended)

1. **Make Changes**

   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

2. **Create Pull Request**
   - GitHub automatically creates preview deployment
   - CI runs tests and checks
   - Review preview deployment
   - Get code review

3. **Merge to Main**

   ```bash
   # After PR approval
   git checkout main
   git pull origin main
   # Merge via GitHub or:
   git merge feature/my-feature
   git push origin main
   ```

4. **Automatic Production Deploy**
   - Netlify automatically deploys to production
   - Monitor deployment in Netlify dashboard

### Manual Deployment

If needed, deploy manually:

```bash
# Install Netlify CLI
bun install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Post-Deployment Verification

### Checklist

- [ ] Application loads at production URL
- [ ] User authentication works (login/signup)
- [ ] Database operations work (create/read/update/delete)
- [ ] Email sending works (test password reset or invitation)
- [ ] File upload works (test blob storage)
- [ ] All pages render correctly
- [ ] Mobile responsiveness works
- [ ] No console errors in browser
- [ ] Error monitoring active (Sentry, if configured)

### Testing Email in Production

```bash
# Use the password reset feature
# Or create a test partner invitation
# Check Resend dashboard for email delivery status
```

### Testing Blob Storage in Production

```bash
# Upload a file through the application
# Verify file appears in Netlify Blobs dashboard
# Verify file is accessible via URL
```

## Troubleshooting

### Build Fails

**Problem:** Build fails in Netlify

**Solutions:**

1. Check build logs in Netlify dashboard (Site → Deploys → specific deploy)
2. Verify environment variables are set correctly
3. Test build locally: `bun run build`
4. Check for TypeScript errors: `bun run type-check`
5. Ensure all dependencies are in `package.json`
6. Verify `netlify.toml` configuration is correct

### Environment Variables Not Working

**Problem:** Application can't access environment variables

**Solutions:**

1. Verify variables are set in Netlify dashboard (Site settings → Environment variables)
2. Check variable names match exactly (case-sensitive)
3. Trigger a new deploy after changing variables
4. For `NEXT_PUBLIC_*` vars, rebuild is required
5. Check deploy context scopes (Production vs Deploy Previews)

### Email Not Sending

**Problem:** Emails not being sent

**Solutions:**

1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for errors
3. Verify sender email is verified (production)
4. Check email logs in Resend dashboard
5. Ensure `NODE_ENV=production` for production

### Blob Storage Fails

**Problem:** File uploads failing

**Solutions:**

1. Verify `BLOB_READ_WRITE_TOKEN` is set
2. If using Netlify Blobs, ensure it's enabled in Integrations
3. Check token has correct permissions
4. Consider using alternative service (Cloudinary, Uploadthing)
5. Check file size limits (varies by service)
6. Review error messages in application logs

### Database Issues

**Problem:** Database errors in production

**Solution:**

The application uses Neon PostgreSQL for all environments:

1. **Netlify Setup:**
   - Go to Netlify Dashboard → Your Site → Integrations
   - Search for "Neon" and connect your Neon database
   - Netlify automatically sets `NETLIFY_DATABASE_URL`
   - Run migrations: `bun run db:migrate` (with NETLIFY_DATABASE_URL set)

2. **Local Development:**
   - Create your own Neon database instance at neon.tech
   - Set `NETLIFY_DATABASE_URL` in `.env.local` with your dev database connection string
   - Run migrations: `bun run db:migrate`

3. **Migration Generation:**
   - Generate migrations: `bun run db:generate`
   - Migrations are PostgreSQL-compatible and work across all environments

### CI Workflow Fails

**Problem:** GitHub Actions CI failing

**Solutions:**

1. Check Actions tab for error details
2. Verify Bun setup action is working
3. Check test database configuration
4. Run tests locally: `bun run test`
5. Verify all dependencies installed

## Rollback Procedures

### Immediate Rollback (Netlify Dashboard)

1. Go to Netlify Dashboard → Your Site
2. Click "Deploys" tab
3. Find last working deployment (marked with ✓)
4. Click on the deployment
5. Click "Publish deploy" or "Restore deploy"
6. Confirm to rollback

### Rollback via Git

```bash
# Find commit to rollback to
git log --oneline

# Create revert commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit (destructive)
git reset --hard <commit-hash>
git push origin main --force
```

### Rollback via Netlify CLI

```bash
# List recent deployments
netlify deploy:list

# Restore a specific deployment
netlify deploy:restore <deploy-id>
```

## Monitoring

### Netlify Analytics

- Enable in Site settings → Analytics
- Available on paid plans (Pro and above)
- Tracks page views, unique visitors, bandwidth
- Server-side analytics (no JavaScript required)

### Alternative: Google Analytics or Plausible

- Free option: Google Analytics
- Privacy-focused: Plausible or Fathom
- Add tracking code to your app

### Error Tracking (Future)

- Sentry integration planned for future story
- Will track runtime errors, performance issues
- Configure with `SENTRY_DSN` environment variable

## Support

For deployment issues:

1. Check this documentation
2. Review Netlify documentation: [docs.netlify.com](https://docs.netlify.com)
3. Review GitHub Actions logs (if using)
4. Check Netlify Support Forums
5. Contact development team

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/overview/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Resend Documentation](https://resend.com/docs)
- [Netlify Blobs Documentation](https://docs.netlify.com/blobs/overview/)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
