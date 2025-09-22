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
| Database               | SQLite                       | ^3.45.0          | Embedded relational database                | Portable, zero-config, ACID compliance, perfect for development and small-medium scale                                         |
| ORM                    | Drizzle ORM                  | ^0.29.0          | Type-safe database access                   | Lightweight, excellent TypeScript integration, migration system, SQLite optimization                                           |
| Database Tools         | Drizzle Kit                  | ^0.20.0          | Schema migrations and introspection         | Essential for database schema evolution and development workflow                                                               |
| File Storage           | Vercel Blob                  | ^0.15.0          | Scalable document/photo storage             | Seamless Vercel integration, CDN delivery, handles large construction documents                                                |
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
| Deployment Platform    | Vercel                       | Latest           | Optimized Next.js hosting                   | Zero-config deployment, edge network, automatic scaling, preview deployments                                                   |
| CI/CD                  | GitHub Actions               | Latest           | Automated testing and deployment            | Free tier, excellent GitHub integration, custom workflows                                                                      |
| Analytics              | Vercel Analytics             | Latest           | User behavior and page views                | Business metrics and user journey tracking for partner engagement                                                              |
| Performance Monitoring | @vercel/speed-insights       | Latest           | Core Web Vitals and performance             | Technical performance optimization data for mobile cost entry                                                                  |
| Error Tracking         | Sentry                       | ^7.100.0         | Production error monitoring and alerting    | React integration, performance monitoring, release tracking                                                                    |
| Email Service          | Resend                       | ^3.2.0           | Transactional email delivery                | Partner notifications, invitation emails, reliable delivery with excellent Next.js DX                                          |
| Design Tokens          | Custom Tailwind Config       | ^3.4.0           | Real estate professional branding           | Ensures partner dashboards have investor-grade aesthetics rather than generic SaaS appearance                                  |

## Future Enterprise Enhancements

**Data Protection (Phase 2):**

- **Database Backup:** Litestream or similar for continuous SQLite replication to S3
- **Disaster Recovery:** Point-in-time recovery and automated backup verification
- **Compliance:** Enhanced audit logging and data retention policies for enterprise clients
