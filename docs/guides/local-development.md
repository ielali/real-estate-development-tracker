# Local Development Setup Guide

This guide walks you through setting up the Real Estate Development Tracker for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Development Server](#running-the-development-server)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Node.js 18 or higher**

   ```bash
   # Check version
   node --version

   # Install from https://nodejs.org/ or use nvm
   nvm install 18
   nvm use 18
   ```

2. **Bun (Recommended Package Manager)**

   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash

   # Check version
   bun --version
   ```

   Alternatively, you can use npm (comes with Node.js).

3. **Git**

   ```bash
   # Check version
   git --version

   # Install from https://git-scm.com/
   ```

### Optional (Recommended)

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma (for Drizzle schema highlighting)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/realestate-portfolio.git
cd realestate-portfolio
```

### 2. Install Dependencies

Using Bun (recommended):

```bash
bun install
```

Using npm:

```bash
npm install
```

This installs all dependencies for the monorepo, including the main web app and shared packages.

### 3. Verify Installation

```bash
# Check that Turborepo is working
bun run --filter=web typecheck

# Or with npm
npm run typecheck --workspace=web
```

## Environment Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

Edit `.env.local` with the following required variables:

#### Database Configuration

```bash
# Neon PostgreSQL connection string
NETLIFY_DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require"
```

**How to get this:**

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a project or use existing
3. Copy the connection string from dashboard
4. Replace the value above

#### Authentication Configuration

```bash
# Better-auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-32-character-or-longer-secret-key-here"

# Base URL for your app
BETTER_AUTH_URL="http://localhost:3000"
DEPLOY_PRIME_URL="http://localhost:3000"
```

**Generate auth secret:**

```bash
openssl rand -base64 32
```

### 3. Optional Environment Variables

These are optional for basic development but required for full functionality:

#### Email Configuration (Resend)

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

**Without this:** Email sending will log to console instead.

**How to get this:**

1. Sign up at [Resend](https://resend.com/)
2. Verify your domain or use test mode
3. Create API key in dashboard

#### File Storage (Netlify Blobs)

```bash
BLOB_READ_WRITE_TOKEN="your-netlify-blob-token"
```

**Without this:** File uploads will fail.

**How to get this:**

1. Deploy site to Netlify
2. Enable Netlify Blobs in site settings
3. Get token from Netlify dashboard

#### Address Autocomplete (Google Maps)

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Without this:** Address autocomplete falls back to manual entry.

**How to get this:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API and Places API
3. Create API key with restrictions

## Database Setup

### 1. Run Migrations

Apply database schema:

```bash
bun run db:migrate

# Or with npm
npm run db:migrate
```

This creates all necessary tables in your Neon database.

### 2. Seed Database (Optional)

Add sample data for development:

```bash
bun run db:seed

# Or with npm
npm run db:seed
```

This creates:

- Sample user account (email: `dev@example.com`, password: `password123`)
- 2-3 example projects
- Sample costs and contacts

### 3. Verify Database

Check that tables were created:

```bash
# List all migrations
bun run drizzle-kit migrations:list

# Verify connection
bun run db:studio
```

Drizzle Studio opens at `https://local.drizzle.studio` for visual database exploration.

## Running the Development Server

### Start the Server

Using Bun:

```bash
bun run dev
```

Using npm:

```bash
npm run dev
```

The application will be available at:

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api/trpc

### Verify It's Working

1. Open http://localhost:3000
2. You should see the login page
3. If you seeded the database, login with:
   - Email: `dev@example.com`
   - Password: `password123`

### Development Server Features

- **Hot Module Replacement (HMR):** Changes update instantly
- **TypeScript Compilation:** Automatic type checking
- **API Routes:** tRPC procedures available immediately
- **Fast Refresh:** React components update without losing state

## Common Development Tasks

### Type Checking

```bash
# Check TypeScript errors
bun run typecheck

# Watch mode
bun run typecheck --watch
```

### Linting

```bash
# Run ESLint
bun run lint

# Auto-fix issues
bun run lint --fix
```

### Code Formatting

```bash
# Format all files
bun run format

# Check formatting
bun run format:check
```

### Database Operations

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Reset database (⚠️ deletes all data)
bun run db:reset

# Open Drizzle Studio
bun run db:studio
```

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e
```

See [Testing Guide](./testing.md) for comprehensive testing documentation.

### Build for Production

```bash
# Build the application
bun run build

# Test production build locally
bun run start
```

### Clean Build Artifacts

```bash
# Clean all build outputs
bun run clean

# Clean and reinstall dependencies
rm -rf node_modules bun.lock
bun install
```

## Development Workflow

### Typical Development Session

1. **Pull Latest Changes**

   ```bash
   git pull origin main
   bun install  # Update dependencies if needed
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start Development Server**

   ```bash
   bun run dev
   ```

4. **Make Changes**
   - Edit code in your IDE
   - Changes hot-reload automatically
   - Check browser for updates

5. **Run Quality Checks**

   ```bash
   bun run typecheck
   bun run lint
   bun run test
   ```

6. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

   Pre-commit hooks automatically run type checking, linting, and formatting.

7. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for complete workflow details.

### Making Schema Changes

1. **Edit Schema**

   ```typescript
   // apps/web/src/server/db/schema.ts
   export const newTable = pgTable("new_table", {
     id: uuid("id").defaultRandom().primaryKey(),
     name: text("name").notNull(),
   })
   ```

2. **Generate Migration**

   ```bash
   bun run db:generate
   ```

3. **Review Migration**

   ```bash
   # Check generated SQL in drizzle/migrations/
   cat drizzle/migrations/0001_new_table.sql
   ```

4. **Apply Migration**

   ```bash
   bun run db:migrate
   ```

5. **Update Types** (automatic)
   TypeScript types are automatically updated from schema

## Troubleshooting

### Port Already in Use

If port 3000 is already taken:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun run dev
```

### Database Connection Errors

**Error:** `Connection refused` or `SSL required`

**Solution:**

1. Verify `NETLIFY_DATABASE_URL` in `.env.local`
2. Ensure URL includes `?sslmode=require`
3. Check Neon database is running (not paused)

```bash
# Test database connection
bun run db:studio
```

### Module Not Found Errors

**Error:** `Cannot find module '@/components/ui/button'`

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules
bun install

# Clear Next.js cache
rm -rf apps/web/.next
bun run dev
```

### TypeScript Errors After Git Pull

**Error:** Type errors after pulling latest changes

**Solution:**

```bash
# Reinstall dependencies
bun install

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### Authentication Not Working

**Error:** Session errors or login failures

**Solution:**

1. Check `BETTER_AUTH_SECRET` is set and 32+ characters
2. Verify `BETTER_AUTH_URL` matches your local URL
3. Clear browser cookies for localhost:3000
4. Restart development server

### Slow Performance

**Solution:**

```bash
# Clear Turbo cache
rm -rf .turbo

# Clear Next.js cache
rm -rf apps/web/.next

# Restart dev server
bun run dev
```

### More Issues?

See [Troubleshooting Guide](./troubleshooting.md) for comprehensive issue resolution.

## Next Steps

After setup is complete:

1. **Explore the Codebase**
   - Review [Architecture Overview](../../ARCHITECTURE.md)
   - Study [Coding Standards](../architecture/coding-standards.md)
   - Examine existing components

2. **Run Tests**
   - See [Testing Guide](./testing.md)
   - Run test suite: `bun run test`
   - Write your first test

3. **Make Your First Change**
   - Pick a small issue or feature
   - Follow [Contributing Guidelines](../../CONTRIBUTING.md)
   - Submit a pull request

4. **Join the Team**
   - Ask questions in GitHub Discussions
   - Review open issues
   - Help improve documentation

## Additional Resources

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Architecture overview
- [Testing Guide](./testing.md) - Testing practices
- [Deployment Guide](./deployment.md) - Production deployment
- [API Documentation](../api/README.md) - API reference
- [Component Documentation](../components/README.md) - UI components

---

**Need Help?** Create a GitHub issue or discussion for support.
