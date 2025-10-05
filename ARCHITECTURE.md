# Architecture Overview

This document provides a high-level overview of the Real Estate Development Tracker architecture. For detailed technical documentation, see the [architecture documentation directory](docs/architecture/).

## Table of Contents

- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Detailed Documentation](#detailed-documentation)

## System Architecture

The Real Estate Development Tracker is a **fullstack TypeScript application** built as a monorepo using Turborepo. It follows a modern serverless architecture deployed on Netlify.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js App Router (React) + Shadcn/ui + Tailwind CSS      │
│                    TypeScript Frontend                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ tRPC (Type-safe API)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (tRPC)                         │
│         Next.js API Routes + tRPC Routers/Procedures        │
│                  Zod Validation + Auth                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Drizzle ORM
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Neon)                         │
│               Neon PostgreSQL (Serverless)                   │
│                 Migrations + Schema                          │
└─────────────────────────────────────────────────────────────┘

External Services:
├── Better-auth (Authentication & Sessions)
├── Resend (Email Delivery)
├── Netlify Blobs (File Storage)
└── Google Maps API (Address Autocomplete)
```

## Technology Stack

### Core Technologies

| Layer             | Technology               | Purpose                      |
| ----------------- | ------------------------ | ---------------------------- |
| **Frontend**      | Next.js 14+ (App Router) | React framework with SSR/SSG |
| **Language**      | TypeScript 5.3+          | Type safety across stack     |
| **UI Components** | Shadcn/ui                | Accessible component library |
| **Styling**       | Tailwind CSS             | Utility-first CSS framework  |
| **API**           | tRPC 10+                 | End-to-end type-safe APIs    |
| **Database**      | Neon PostgreSQL          | Serverless PostgreSQL        |
| **ORM**           | Drizzle ORM              | Type-safe database access    |
| **Auth**          | Better-auth              | Session management & RBAC    |
| **Validation**    | Zod                      | Runtime schema validation    |

### Development Tools

- **Package Manager:** Bun (fast JavaScript runtime)
- **Build Tool:** Turborepo (monorepo orchestration)
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Code Quality:** ESLint, Prettier, Husky, lint-staged
- **Deployment:** Netlify + GitHub Actions

See [Tech Stack Documentation](docs/architecture/tech-stack.md) for complete technology details.

## Project Structure

### Monorepo Organization

```
realestate-portfolio/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── src/
│       │   ├── app/           # App Router (pages, layouts, routes)
│       │   ├── components/    # React components
│       │   │   ├── ui/        # Shadcn/ui base components
│       │   │   └── ...        # Feature components
│       │   ├── server/        # Backend code
│       │   │   ├── api/       # tRPC routers
│       │   │   └── db/        # Database schema & client
│       │   ├── lib/           # Utilities & helpers
│       │   └── styles/        # Global styles
│       ├── drizzle/           # Database migrations
│       ├── public/            # Static assets
│       └── package.json
│
├── packages/                   # Shared packages
│   ├── shared/                # Shared types & utilities
│   ├── ui/                    # Shared UI components
│   └── config/                # Shared configuration
│
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── architecture/          # Architecture docs
│   ├── components/            # Component docs
│   ├── guides/                # Development guides
│   ├── prd/                   # Product requirements
│   └── stories/               # Development stories
│
├── .github/workflows/         # CI/CD pipelines
├── CONTRIBUTING.md            # Contribution guidelines
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # Project overview
```

## Key Architectural Decisions

### 1. Monorepo with Turborepo

**Decision:** Use Turborepo monorepo structure

**Rationale:**

- Shared code between frontend/backend
- Unified TypeScript configuration
- Coordinated versioning and releases
- Efficient build caching and parallelization

### 2. Next.js App Router

**Decision:** Use Next.js 14+ App Router (not Pages Router)

**Rationale:**

- Server Components for improved performance
- Simplified data fetching patterns
- Built-in loading and error states
- Better mobile performance for on-site usage

### 3. tRPC for API Layer

**Decision:** Use tRPC instead of REST or GraphQL

**Rationale:**

- End-to-end type safety without code generation
- Automatic TypeScript inference from backend to frontend
- Excellent developer experience
- Perfect for TypeScript-first monorepo

### 4. Neon PostgreSQL (All Environments)

**Decision:** Use Neon PostgreSQL for both development and production

**Rationale:**

- Serverless architecture with automatic scaling
- Consistency between dev and prod environments
- Point-in-time recovery and automated backups
- Native Netlify integration
- No local database setup required

### 5. Better-auth for Authentication

**Decision:** Use Better-auth instead of NextAuth.js

**Rationale:**

- Built-in role-based access control (RBAC)
- Simple session management
- Flexible provider configuration
- TypeScript-first design

### 6. Mobile-First Design

**Decision:** Design and build mobile-first, then scale up

**Rationale:**

- Primary use case is on-site cost entry (mobile)
- 70% of usage expected on mobile devices
- Better performance on mobile networks
- Improved accessibility

See [Architecture Documentation](docs/architecture/) for detailed architectural decisions.

## Data Flow

### Request Flow

1. **User Interaction** → User performs action in UI (click, form submit)
2. **Client Validation** → React Hook Form + Zod validates locally
3. **tRPC Mutation** → Type-safe API call to backend
4. **Server Validation** → Zod schema validates on server
5. **Authorization** → Better-auth checks permissions
6. **Business Logic** → tRPC procedure executes logic
7. **Database Operation** → Drizzle ORM queries Neon PostgreSQL
8. **Response** → Type-safe response back to client
9. **UI Update** → React Query updates cache & re-renders

### State Management

- **Server State:** React Query (via tRPC hooks)
- **Form State:** React Hook Form
- **UI State:** React useState/useReducer
- **Global State:** React Context (minimal usage)

### Data Flow Patterns

```typescript
// Frontend: Type-safe API call
const createProject = api.projects.create.useMutation({
  onSuccess: (project) => {
    // Optimistic update
    queryClient.invalidateQueries(["projects"])
  },
})

// Backend: Type-safe procedure
create: protectedProcedure
  .input(createProjectSchema) // Zod validation
  .mutation(async ({ ctx, input }) => {
    // ctx.user is authenticated user
    return await ctx.db.insert(projects).values({
      ...input,
      ownerId: ctx.user.id,
    })
  })
```

## Security Architecture

### Authentication & Authorization

- **Session Management:** Better-auth with secure HTTP-only cookies
- **Password Hashing:** bcrypt with configurable rounds
- **CSRF Protection:** Built into Next.js and Better-auth
- **Role-Based Access:** Partner vs Owner permissions

### Data Protection

- **Input Validation:** Zod schemas on all API endpoints
- **SQL Injection Prevention:** Drizzle ORM parameterized queries
- **XSS Prevention:** React automatic escaping
- **Soft Delete:** Preserve data, prevent permanent loss

### Access Control Patterns

```typescript
// Resource ownership verification
const project = await ctx.db.query.projects.findFirst({
  where: and(
    eq(projects.id, input.projectId),
    eq(projects.ownerId, ctx.user.id) // Ownership check
  ),
})

if (!project) {
  throw new TRPCError({ code: "FORBIDDEN" })
}
```

See [Security Standards](docs/architecture/coding-standards.md#security-standards) for complete security guidelines.

## Detailed Documentation

### Architecture Documentation

Comprehensive technical documentation in `docs/architecture/`:

- **[Coding Standards](docs/architecture/coding-standards.md)** - Code quality, UI/UX standards, patterns
- **[Tech Stack](docs/architecture/tech-stack.md)** - Complete technology selection and rationale
- **[Development Workflow](docs/architecture/development-workflow.md)** - Local dev, testing, deployment
- **[Testing Strategy](docs/architecture/testing-strategy.md)** - Test organization and patterns
- **[Deployment Architecture](docs/architecture/deployment-architecture.md)** - Netlify deployment details

### Developer Guides

Practical guides in `docs/guides/`:

- **[Local Development](docs/guides/local-development.md)** - Setup and daily development
- **[Testing Guide](docs/guides/testing.md)** - Writing and running tests
- **[Deployment Guide](docs/guides/deployment.md)** - Production deployment
- **[Troubleshooting](docs/guides/troubleshooting.md)** - Common issues and solutions

### API & Components

- **[API Documentation](docs/api/README.md)** - tRPC endpoints and examples
- **[Component Documentation](docs/components/README.md)** - UI component library

### Product Documentation

- **[Product Requirements](docs/prd/)** - Detailed feature specifications
- **[Development Stories](docs/stories/)** - User story implementations

## Architecture Principles

### 1. Type Safety First

- TypeScript strict mode enabled
- End-to-end type safety with tRPC
- Runtime validation with Zod
- No `any` types allowed

### 2. Mobile-First Development

- Design for 375px mobile screens first
- Progressive enhancement for larger screens
- Touch-optimized interactions
- Offline-capable (future enhancement)

### 3. Developer Experience

- Fast feedback loops with hot reload
- Comprehensive error messages
- Automated code quality checks
- Clear documentation and examples

### 4. Security by Default

- Authentication required for all operations
- Resource ownership validation
- Input validation on server
- Secure session management

### 5. Maintainability

- Clear separation of concerns
- Consistent code patterns
- Comprehensive test coverage
- Well-documented business logic

## Getting Started

1. **New Developers:** Start with [Local Development Guide](docs/guides/local-development.md)
2. **Contributing:** Read [CONTRIBUTING.md](CONTRIBUTING.md)
3. **Understanding Codebase:** Review [Coding Standards](docs/architecture/coding-standards.md)
4. **Deployment:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## Additional Resources

- **Main README:** [README.md](README.md) - Project overview and quick start
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- **Architecture Docs:** [docs/architecture/](docs/architecture/) - Detailed technical docs
- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow

---

**Version:** 1.0
**Last Updated:** 2025-10-05
**Maintained By:** Development Team
