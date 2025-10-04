# Development Workflow

## Local Development Setup

**Prerequisites:**

```bash
# Install Node.js 22+ and Bun
node --version  # Should be 22+
bun --version   # Should be 1.0+

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash
```

**Initial Setup:**

```bash
# Install all dependencies
bun install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with required values (including Neon database URL)

# Set up Neon PostgreSQL database
# 1. Create account at https://neon.tech
# 2. Create a new database project
# 3. Copy connection string to NETLIFY_DATABASE_URL in .env.local

# Run database migrations
cd apps/web
bun run db:migrate

# Start development server
bun run dev
```

**Development Commands:**

```bash
# Start development server (from root)
bun run dev

# Run type checking
bun run type-check

# Run linting and formatting
bun run lint
bun run format

# Run tests
bun run test

# Run E2E tests (requires Playwright)
bun run test:e2e

# Build for production
bun run build

# Database commands
cd apps/web
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate   # Apply migrations to Neon
bun run db:seed      # Seed with sample data
bun run db:reset     # Reset database (warning: deletes all data)
```

## Environment Configuration

**Local Development (.env.local):**

```bash
# Application
NODE_ENV=development
DEPLOY_PRIME_URL=http://localhost:3000

# Database - Neon PostgreSQL (required)
# Get from: https://neon.tech - create your own development database
NETLIFY_DATABASE_URL=postgresql://[user]:[pass]@[host].neon.tech/[db]?sslmode=require

# Authentication
BETTER_AUTH_SECRET=dev-secret-minimum-32-chars-long

# Email Service (optional for local dev)
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

# File Storage (optional for local dev)
BLOB_READ_WRITE_TOKEN=

# External APIs (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**Required Environment Variables:**

- `NETLIFY_DATABASE_URL` - Neon PostgreSQL connection string (required for all environments)
- `BETTER_AUTH_SECRET` - Minimum 32 characters for session encryption
- `DEPLOY_PRIME_URL` - Application base URL for redirects

**Optional Environment Variables:**

- `RESEND_API_KEY` - For email sending (optional in development)
- `BLOB_READ_WRITE_TOKEN` - For file uploads (optional in development)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For address autocomplete

## Git Workflow

**Branch Naming:**

```bash
feature/epic-{n}-story-{n}.{n}  # Feature branches
bugfix/issue-description         # Bug fixes
hotfix/critical-issue           # Production hotfixes
```

**Commit Convention:**

```bash
# Format: type(scope): message

feat(projects): add project creation form
fix(auth): resolve session timeout issue
docs(deployment): update Netlify setup guide
test(costs): add cost entry validation tests
refactor(api): simplify tRPC router structure
chore(deps): update dependencies
```

**Development Flow:**

```bash
# 1. Create feature branch
git checkout -b feature/epic-1-story-1.2

# 2. Make changes and commit
git add .
git commit -m "feat(projects): add address autocomplete"

# 3. Push to GitHub
git push origin feature/epic-1-story-1.2

# 4. Create Pull Request
# - GitHub Actions will run CI tests
# - Netlify will create preview deployment
# - Request code review

# 5. Merge to main after approval
# - Netlify will automatically deploy to production
```

## Code Quality Gates

**Pre-commit Hooks (Husky):**

```bash
# Automatically runs on git commit
- Lint staged files
- Format with Prettier
- Type check affected files
```

**GitHub Actions CI:**

```bash
# Runs on every push and PR
- Type checking (bun run type-check)
- Linting (bun run lint)
- Unit tests (bun run test)
- Build verification (bun run build)
```

**Pre-merge Requirements:**

- ✅ All CI checks passing
- ✅ Code review approved
- ✅ No merge conflicts
- ✅ Preview deployment successful

## Testing Strategy

**Test Types:**

```bash
# Unit Tests (Vitest)
bun run test
bun run test:ui  # Visual test UI

# Integration Tests
bun run test:integration

# E2E Tests (Playwright)
bun run test:e2e

# Test Coverage
bun run test:coverage
```

**Testing Best Practices:**

- Write tests for all tRPC procedures
- Test component interactions and edge cases
- E2E tests for critical user flows
- Maintain >80% code coverage for business logic

## Database Workflow

**Development Database:**

```bash
# Create your own Neon database instance
# 1. Go to https://neon.tech
# 2. Create new project
# 3. Copy connection string
# 4. Add to .env.local as NETLIFY_DATABASE_URL

# Generate migrations after schema changes
cd apps/web
bun run db:generate

# Apply migrations
bun run db:migrate

# Reset database (warning: deletes all data)
bun run db:reset
```

**Production Database:**

- Managed via Netlify Neon integration
- Migrations run automatically during deployment
- Connection string auto-injected as NETLIFY_DATABASE_URL

## Deployment Workflow

**Preview Deployments:**

- Automatically created for every branch push
- URL: `https://[branch]-[site-name].netlify.app`
- Uses preview environment variables
- Ideal for testing before merge

**Production Deployments:**

- Automatically triggered on merge to `main`
- URL: `https://[site-name].netlify.app`
- Database migrations run during build
- Zero-downtime deployment

**Manual Deployment (if needed):**

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

## Troubleshooting

**Database Connection Issues:**

```bash
# Verify Neon database URL is set
echo $NETLIFY_DATABASE_URL

# Test database connection
cd apps/web
bun run db:migrate  # Should connect and show migration status
```

**Build Failures:**

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Verify all environment variables are set
# Check .env.local has all required variables
```

**Type Errors:**

```bash
# Regenerate types
bun run type-check

# If using VSCode, reload window
# CMD/Ctrl + Shift + P → "Reload Window"
```

**Test Failures:**

```bash
# Run tests with verbose output
bun run test --verbose

# Run specific test file
bun run test path/to/test.test.ts

# Update snapshots if UI changed
bun run test -u
```

## Performance Optimization

**Development Performance:**

- Bun provides faster install times vs npm/yarn
- Turborepo caches build outputs
- Hot module replacement for instant feedback

**Build Performance:**

- Netlify caches dependencies between builds
- Incremental builds when possible
- Parallel task execution via Turborepo

**Runtime Performance:**

- Next.js automatic code splitting
- React Server Components for reduced bundle size
- PostgreSQL connection pooling via Neon

## Security Best Practices

**Environment Variables:**

- Never commit `.env.local` or `.env`
- Use `.env.example` as template only
- Store secrets in Netlify dashboard for production
- Rotate secrets regularly

**Database Security:**

- Neon provides SSL/TLS encryption
- Use connection pooling to prevent exhaustion
- Each developer has isolated database instance
- Production database isolated via Netlify integration

**Authentication:**

- Better-auth handles session security
- Passwords hashed automatically
- CSRF protection enabled
- Secure session cookies (httpOnly, secure, sameSite)

---

**Development Workflow Complete**

This workflow ensures consistent development practices, automated quality gates, and smooth deployments using Netlify and Neon PostgreSQL infrastructure.
