# Tech Stack

This is the DEFINITIVE technology selection for the entire project. Working through each category to finalize all choices - this table will be the single source of truth that all development must follow.

## Technology Stack Table

| Category               | Technology                   | Version          | Purpose                                     | Rationale                                                                                                                      |
| ---------------------- | ---------------------------- | ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Frontend Language      | TypeScript                   | ^5.3.0           | Type-safe development across frontend       | Eliminates runtime errors, improves developer productivity, enables better IDE support for complex real estate data structures |
| Frontend Framework     | Next.js                      | ^14.2.0          | Fullstack React framework with App Router   | Server components for performance, built-in optimizations, seamless API integration, excellent mobile performance              |
| UI Component Library   | Shadcn/ui                    | ^0.8.0           | Professional, accessible component system   | Customizable components, WCAG AA compliance, consistent design system, mobile-optimized interactions                           |
| State Management       | React Query (TanStack Query) | ^5.0.0           | Server state management and caching         | Perfect tRPC integration, automatic background refetching, optimistic updates for cost entries                                 |
| Backend Language       | TypeScript                   | ^5.3.0           | Unified language across fullstack           | Shared types between client/server, consistent codebase, reduced context switching                                             |
| Backend Framework      | Next.js API Routes           | ^14.2.0          | Serverless API endpoints                    | Integrated with frontend, automatic deployment, optimal performance on Vercel                                                  |
| API Style              | tRPC                         | ^10.45.0         | Type-safe API layer                         | End-to-end type safety, excellent DX, automatic client generation, perfect for TypeScript monorepo                             |
| Runtime Validation     | Zod                          | ^3.22.0          | Schema validation at API boundaries         | Critical for financial data integrity, seamless tRPC integration, prevents malformed data corruption                           |
| Database               | Neon PostgreSQL              | ^1.0.2           | Serverless PostgreSQL (all environments)    | Serverless architecture, automatic scaling, used for development and production, Netlify integration                           |
| ORM                    | Drizzle ORM                  | ^0.44.6          | Type-safe database access                   | Lightweight, excellent TypeScript integration, migration system, PostgreSQL dialect support                                    |
| Database Tools         | Drizzle Kit                  | ^0.31.5          | Schema migrations and introspection         | Essential for database schema evolution and development workflow                                                               |
| File Storage           | Netlify Blobs                | Latest           | Scalable document/photo storage             | Seamless Netlify integration, CDN delivery, handles large construction documents and photos                                    |
| Authentication         | Better-auth                  | ^1.3.13          | Secure session management with RBAC         | Simple integration, flexible providers, session security, built-in role-based access control                                   |
| Frontend Testing       | Vitest + Testing Library     | ^1.6.0 + ^14.0.0 | Component and utility testing               | Fast execution, Jest compatibility, excellent React integration                                                                |
| Backend Testing        | Vitest                       | ^1.6.0           | API route and business logic testing        | Unified testing framework, TypeScript support, fast feedback loops                                                             |
| E2E Testing            | Playwright                   | ^1.40.0          | Critical user flow validation               | Reliable mobile testing, real browser automation, excellent debugging                                                          |
| Build Tool             | Turborepo                    | ^1.11.0          | Monorepo build optimization                 | Caching, parallelization, incremental builds, excellent DX                                                                     |
| Package Manager        | Bun                          | ^1.0.0           | Fast JavaScript runtime and package manager | Significantly faster install times, built-in TypeScript support, drop-in npm replacement                                       |
| Bundler                | Next.js built-in             | ^14.2.0          | Webpack-based bundling                      | Optimized for React, automatic code splitting, tree shaking                                                                    |
| CSS Framework          | Tailwind CSS                 | ^3.4.0           | Utility-first styling system                | Rapid development, consistent design, excellent mobile responsiveness, Shadcn/ui integration                                   |
| Code Quality           | ESLint + Prettier            | ^8.57.0 + ^3.2.0 | Consistent code standards                   | Automated formatting and linting prevents technical debt accumulation                                                          |
| Git Hooks              | Husky + lint-staged          | ^9.0.0 + ^15.2.0 | Pre-commit quality gates                    | Prevents broken code from entering repository, ensures code quality                                                            |
| Deployment Platform    | Netlify                      | Latest           | Optimized Next.js hosting                   | Zero-config deployment, edge network, automatic scaling, preview deployments, Neon PostgreSQL integration                      |
| CI/CD                  | GitHub Actions + Netlify     | Latest           | Automated testing and deployment            | Free tier, excellent GitHub integration, custom workflows, automatic Netlify deployments                                       |
| Analytics              | Netlify Analytics            | Latest           | User behavior and page views                | Business metrics and user journey tracking for partner engagement                                                              |
| Performance Monitoring | Netlify Speed Insights       | Latest           | Core Web Vitals and performance             | Technical performance optimization data for mobile cost entry                                                                  |
| Error Tracking         | Sentry                       | ^7.100.0         | Production error monitoring and alerting    | React integration, performance monitoring, release tracking                                                                    |
| Email Service          | Resend                       | ^3.2.0           | Transactional email delivery                | Partner notifications, invitation emails, reliable delivery with excellent Next.js DX                                          |
| Design Tokens          | Custom Tailwind Config       | ^3.4.0           | Real estate professional branding           | Ensures partner dashboards have investor-grade aesthetics rather than generic SaaS appearance                                  |

## Database Architecture

**All Environments (Development & Production):**

- Uses Neon PostgreSQL (serverless PostgreSQL) for all environments
- Provides consistency between development and production
- Automatic scaling and connection pooling
- Integrated with Netlify via `NETLIFY_DATABASE_URL` environment variable
- Point-in-time recovery and automated backups included
- Each developer can have their own Neon database instance for local development
- No local SQLite setup required

**Connection Configuration:**

- Environment Variable: `NETLIFY_DATABASE_URL`
- Format: `postgresql://username:password@host.neon.tech/database?sslmode=require`
- Drizzle ORM uses Neon serverless driver with WebSocket support
- WebSocket connection allows for serverless function compatibility

## Future Enterprise Enhancements

**Data Protection (Phase 2):**

- **Enhanced Backups:** Custom backup schedules beyond Neon's automatic backups
- **Disaster Recovery:** Multi-region failover and recovery testing
- **Compliance:** Enhanced audit logging and data retention policies for enterprise clients
