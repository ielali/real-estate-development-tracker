# Deployment Guide

This guide covers the deployment workflow and procedures for the Real Estate Development Tracker. For detailed Netlify-specific setup, see [DEPLOYMENT.md](../../DEPLOYMENT.md) in the project root.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Deployment Workflow](#deployment-workflow)
- [Environment Configuration](#environment-configuration)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Continuous Deployment](#continuous-deployment)

## Deployment Overview

### Deployment Architecture

```
GitHub Repository
       ↓
  Push to main
       ↓
GitHub Actions (CI)
  - Run tests
  - Type checking
  - Linting
       ↓
   All checks pass
       ↓
Netlify Build
  - Install deps
  - Run migrations
  - Build Next.js
       ↓
   Deploy to Edge
       ↓
  Production Live
```

### Deployment Platform

- **Platform:** Netlify
- **Region:** Global Edge Network
- **Database:** Neon PostgreSQL (serverless)
- **File Storage:** Netlify Blobs
- **Email:** Resend

### Deployment Types

1. **Production Deployment**
   - Triggered by push to `main` branch
   - Full CI/CD pipeline
   - Automatic database migrations
   - Production environment variables

2. **Preview Deployments**
   - Created for all pull requests
   - Temporary preview URL
   - Uses preview database (optional)
   - Full feature testing before merge

3. **Manual Deployments**
   - Triggered via Netlify dashboard
   - Useful for debugging
   - Can deploy specific commits
   - Bypass GitHub Actions (use cautiously)

## Deployment Workflow

### Standard Release Process

1. **Prepare Release**

   ```bash
   # Ensure you're on main and up to date
   git checkout main
   git pull origin main

   # Run all quality checks locally
   bun run typecheck
   bun run lint
   bun run test
   bun run build
   ```

2. **Verify Changes**

   ```bash
   # Review recent commits
   git log --oneline -10

   # Check for breaking changes
   git diff HEAD~5..HEAD

   # Verify migrations
   ls -la apps/web/drizzle/migrations/
   ```

3. **Tag Release (Optional)**

   ```bash
   # Create version tag
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

4. **Deploy**

   ```bash
   # Push to main (triggers deployment)
   git push origin main
   ```

5. **Monitor Deployment**
   - Watch GitHub Actions progress
   - Monitor Netlify build logs
   - Check deployment status

### Preview Deployment Workflow

1. **Create Pull Request**

   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   ```

2. **Automatic Preview**
   - Netlify automatically creates preview deployment
   - Preview URL posted as PR comment
   - Updates on every push to PR branch

3. **Test Preview**
   - Visit preview URL
   - Test new features
   - Verify no regressions
   - Share with stakeholders

4. **Merge to Deploy**
   ```bash
   # After PR approval
   git checkout main
   git merge feature/new-feature
   git push origin main
   ```

## Environment Configuration

### Required Environment Variables

Configure in Netlify dashboard under **Site settings → Environment variables**:

#### Core Configuration

```bash
# Database (Neon PostgreSQL)
NETLIFY_DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# Authentication (Better-auth)
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="https://your-site.netlify.app"
DEPLOY_PRIME_URL="https://your-site.netlify.app"
```

#### External Services

```bash
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# File Storage (Netlify Blobs)
BLOB_READ_WRITE_TOKEN="netlify-blob-token"

# Address Autocomplete (Google Maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXX"
```

### Environment Variable Management

#### Production Variables

1. **Navigate to Netlify Site Settings**
   - Go to Netlify dashboard
   - Select your site
   - Navigate to **Site settings → Environment variables**

2. **Add Variables**
   - Click **Add a variable**
   - Select **Production** scope
   - Enter key and value
   - Save changes

3. **Redeploy**
   ```bash
   # Trigger redeploy to pick up new variables
   git commit --allow-empty -m "chore: update env vars"
   git push origin main
   ```

#### Preview Variables

Set different values for preview deployments:

1. Add variable with **Deploy Preview** scope
2. Use test/staging values for external services
3. Avoid production credentials in previews

### External Service Setup

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for detailed setup of:

- Neon PostgreSQL database
- Resend email service
- Netlify Blobs storage
- Google Maps API

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`bun run test`)
- [ ] No TypeScript errors (`bun run typecheck`)
- [ ] No linting errors (`bun run lint`)
- [ ] Code properly formatted (`bun run format`)

### Database

- [ ] Migrations generated for schema changes
- [ ] Migrations tested in development
- [ ] Backward compatible (if needed)
- [ ] No destructive changes without backup plan

### Environment

- [ ] All required environment variables set in Netlify
- [ ] External services configured (Neon, Resend, etc.)
- [ ] API keys are production-ready
- [ ] Sensitive data not committed to repo

### Documentation

- [ ] CHANGELOG updated with changes
- [ ] API changes documented
- [ ] Breaking changes highlighted
- [ ] Deployment notes added (if special steps needed)

### Testing

- [ ] E2E tests pass locally
- [ ] Preview deployment tested
- [ ] Critical user flows verified
- [ ] Mobile responsiveness checked

## Deployment Process

### Automatic Deployment (Recommended)

1. **Push to Main**

   ```bash
   git push origin main
   ```

2. **GitHub Actions CI**
   - Runs automatically on push
   - Executes test suite
   - Type checking
   - Linting

3. **Netlify Build**
   - Installs dependencies
   - Runs database migrations
   - Builds Next.js application
   - Optimizes assets

4. **Deploy to Edge**
   - Deploys to Netlify edge network
   - Updates DNS automatically
   - Activates new deployment

### Manual Deployment

**Use only for debugging or emergency deployments:**

1. **Netlify Dashboard**
   - Go to **Deploys** tab
   - Click **Trigger deploy**
   - Select **Deploy site**

2. **Deploy Specific Commit**
   - Go to **Deploys** tab
   - Find commit in history
   - Click **...** → **Publish deploy**

3. **Netlify CLI**

   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login
   netlify login

   # Manual deploy
   netlify deploy --prod
   ```

## Post-Deployment Verification

### Automated Checks

After deployment, verify:

1. **Application Health**

   ```bash
   # Check site is accessible
   curl -I https://your-site.netlify.app

   # Verify API endpoint
   curl https://your-site.netlify.app/api/health
   ```

2. **Critical Functionality**
   - [ ] Homepage loads
   - [ ] Authentication works
   - [ ] API responds correctly
   - [ ] Database connectivity

### Manual Verification

1. **User Flows**
   - [ ] Login/logout
   - [ ] Create project
   - [ ] Add costs
   - [ ] View dashboards

2. **Data Integrity**
   - [ ] Existing data loads correctly
   - [ ] New features work with existing data
   - [ ] No broken relationships

3. **Performance**
   - [ ] Page load times acceptable (<3s)
   - [ ] No console errors
   - [ ] Images load correctly

4. **Mobile**
   - [ ] Responsive on mobile devices
   - [ ] Touch interactions work
   - [ ] Forms usable on small screens

### Monitoring

Check monitoring dashboards:

- **Netlify Analytics:** Page views, performance
- **Error Tracking:** Check for new errors
- **Database Monitoring:** Query performance in Neon

## Rollback Procedures

### Quick Rollback (Netlify)

1. **Via Dashboard**
   - Go to **Deploys** tab
   - Find last known good deployment
   - Click **...** → **Publish deploy**
   - Confirm rollback

2. **Via CLI**

   ```bash
   # List recent deployments
   netlify deploy:list

   # Rollback to specific deployment
   netlify rollback --deploy-id <deployment-id>
   ```

### Database Rollback

**⚠️ Use with extreme caution:**

1. **Revert Migration**

   ```bash
   # Connect to database
   psql $NETLIFY_DATABASE_URL

   # Identify migration to revert
   SELECT * FROM drizzle_migrations ORDER BY created_at DESC;

   # Manually revert (no automatic down migrations in Drizzle)
   # Run reverse SQL statements
   ```

2. **Point-in-Time Recovery (Neon)**
   - Neon supports point-in-time recovery
   - Go to Neon dashboard
   - Select **Restore** → Choose timestamp
   - Create new branch from restore point

### Code Rollback

1. **Revert Commit**

   ```bash
   # Revert the problematic commit
   git revert <commit-hash>
   git push origin main
   ```

2. **Force Rollback**
   ```bash
   # ⚠️ Only for emergencies
   git reset --hard <last-good-commit>
   git push --force origin main
   ```

### Rollback Checklist

- [ ] Identify root cause before rolling back
- [ ] Notify team of rollback
- [ ] Document issue in incident log
- [ ] Verify rollback successful
- [ ] Plan fix for next deployment

## Continuous Deployment

### CI/CD Pipeline

Our GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run test
```

### Deployment on Netlify

Netlify configuration (`netlify.toml`):

```toml
[build]
  command = "cd apps/web && bun run db:migrate && bun run build"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Branch Deployments

- **main → Production:** Automatic deployment
- **Pull Requests → Preview:** Temporary preview URLs
- **Other branches:** No automatic deployment

### Deployment Notifications

Configure in Netlify:

- **Build notifications:** Email on build success/failure
- **Slack integration:** Post to Slack channel
- **GitHub status checks:** Show status on PRs

## Best Practices

### Deployment Strategy

1. **Deploy During Low Traffic**
   - Schedule deploys during off-peak hours
   - Minimize user disruption

2. **Use Preview Deployments**
   - Test all changes in preview first
   - Share with stakeholders before production

3. **Incremental Deployments**
   - Deploy small, frequent changes
   - Easier to identify and fix issues

4. **Feature Flags**
   - Use feature flags for major changes
   - Enable features gradually
   - Quick rollback without redeployment

### Security

- **Never commit secrets:** Use environment variables
- **Rotate credentials:** Regular key rotation
- **Audit access:** Review who can deploy
- **Monitor logs:** Check for unauthorized access

### Disaster Recovery

- **Database Backups:** Neon automatic backups (7-day retention)
- **Code Backups:** Git repository (multiple copies)
- **Documentation:** Keep runbooks updated
- **Communication Plan:** Who to notify during outages

## Troubleshooting Deployments

### Common Issues

**Build Failures**

```bash
# Check build logs in Netlify
# Common causes:
# - Missing environment variables
# - Dependency installation errors
# - TypeScript errors
# - Migration failures
```

**Runtime Errors**

```bash
# Check Netlify Functions logs
# Common causes:
# - Database connection issues
# - API key problems
# - CORS configuration
```

**Performance Issues**

```bash
# Check Netlify Analytics
# Check Neon query performance
# Review bundle size
```

See [Troubleshooting Guide](./troubleshooting.md) for detailed solutions.

## Additional Resources

- [Netlify Deployment Guide](../../DEPLOYMENT.md) - Detailed Netlify setup
- [Netlify Documentation](https://docs.netlify.com/)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Troubleshooting Guide](./troubleshooting.md)

---

**Questions?** Create a GitHub issue or discussion for deployment help.
