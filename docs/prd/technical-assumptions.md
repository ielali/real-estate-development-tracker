# Technical Assumptions

## Repository Structure: Monorepo

Utilizing Turborepo for optimized builds and caching, with Next.js app and API routes in a single package, shared packages for types and utilities, and environment-based configuration.

## Service Architecture

**Monolith with Next.js Full-Stack Framework** - Leveraging Next.js API routes for backend logic, Server Components for initial data fetching, and unified deployment. This simplifies development and hosting while providing excellent performance through edge runtime support.

## Testing Requirements

**Unit + Integration Testing** - Unit tests for critical business logic (cost calculations, data transformations), integration tests for API endpoints and database operations, with Playwright for critical user flows. Manual testing convenience methods for development.

## Additional Technical Assumptions and Requests

- **Frontend Stack:** Next.js 15.5+ with App Router, TypeScript for full type safety, Shadcn/ui component library, Tailwind CSS for styling, Framer Motion for professional animations, React Query for server state management
- **Backend Stack:** Next.js API routes with tRPC for type-safe APIs, Drizzle ORM 0.44+ for database access, Better-auth for authentication, Zod for validation schemas
- **Database:** SQLite with Drizzle Kit 0.31+ for schema management and migrations, consideration for Turso (hosted SQLite) if edge replication needed, blob storage for documents within SQLite initially
- **Infrastructure:** Vercel for optimized Next.js hosting, Cloudflare R2 or AWS S3 for document storage (when blob storage exceeds SQLite limits), automated backups via GitHub Actions
- **Security:** HTTPS everywhere, Better-auth session management, environment variables for secrets, CSRF protection via Next.js, rate limiting on API routes
- **Development Tools:** ESLint and Prettier for code quality, Husky for pre-commit hooks, GitHub Actions for CI/CD, Cursor/GitHub Copilot for AI-assisted development
