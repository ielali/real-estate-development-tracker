# Development Workflow

## Local Development Setup

**Prerequisites:**
```bash
# Install Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 9+

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with required values
```

**Initial Setup:**
```bash
# Install all dependencies
npm install

# Set up database
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed with sample data

# Generate TypeScript types
npm run generate

# Build shared packages
npm run build:packages
```

**Development Commands:**
```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting and formatting
npm run lint
npm run format

# Run tests
npm run test
npm run test:e2e
```

## Environment Configuration

**Frontend (.env.local):**
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend (.env):**
```bash
DATABASE_URL=file:./dev.db
BETTER_AUTH_SECRET=your-auth-secret
RESEND_API_KEY=your-resend-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

**Shared:**
```bash
NODE_ENV=development
```
