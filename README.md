# Real Estate Development Tracker

A comprehensive web application for managing real estate development projects, tracking costs, managing contacts, and providing transparent partner dashboards.

## Overview

The Real Estate Development Tracker is a full-stack web application designed to streamline project management for real estate developers. It consolidates fragmented tools (spreadsheets, folders, photos) into one mobile-friendly system, reducing partner update preparation time from 3-5 hours to under 30 minutes.

### Key Features

- **Multi-Project Management** - Create and manage multiple development projects with comprehensive metadata
- **Financial Tracking** - Real-time cost tracking with vendor linkage and tax-compliant categorization
- **Contact Directory** - Centralized database of contractors, vendors, partners with role categorization
- **Document Management** - Upload and organize project documents and photos with automatic associations
- **Project Timeline** - Chronological event tracking linked to contacts and documents
- **Partner Transparency** - Secure partner access with professional read-only dashboards
- **Mobile-First Design** - Fully responsive PWA optimized for on-site data entry

## Technology Stack

### Frontend

- **Next.js 14+** with App Router
- **TypeScript** for full type safety
- **Shadcn/ui** component library
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for server state management

### Backend

- **Next.js API Routes** with tRPC for type-safe APIs
- **Drizzle ORM** for database access
- **Better-auth** for authentication
- **Zod** for validation schemas

### Database & Infrastructure

- **SQLite** with Drizzle migrations (Development)
- **Vercel** for hosting and deployment
- **Vercel Blob** for file/document storage
- **Resend** for transactional emails
- **Better-auth** for session management
- **GitHub Actions** for CI/CD pipeline

## Project Structure

```
realestate-portfolio/
├── .bmad-core/          # BMad framework configuration and templates
├── docs/                # Project documentation
│   ├── architecture/    # Technical architecture documentation
│   ├── design/          # UI/UX design documents
│   ├── prd/             # Product requirements (sharded)
│   └── stories/         # Development stories
├── .claude/             # Claude AI configuration
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and Bun (recommended) or npm
- Git
- SQLite (for local development)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd realestate-portfolio
```

2. Install dependencies:

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

See [Environment Variables](#environment-variables) section for required values.

4. Initialize the database:

```bash
# Using Bun
bun run db:migrate
bun run db:seed  # Optional: Add sample data

# Or using npm
npm run db:migrate
npm run db:seed
```

5. Start the development server:

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (development only)

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write unit tests for critical business logic
- Follow the established folder structure
- Use conventional commits for version control

### Development Workflow

1. Create a feature branch from `main`
2. Implement changes following coding standards
3. Run tests and linting before committing
4. Create a pull request with clear description
5. Ensure CI checks pass before merging

## Environment Variables

The application requires several environment variables to function. Copy `.env.example` to `.env.local` and configure:

### Required for Development

| Variable              | Description                        | Example                                 |
| --------------------- | ---------------------------------- | --------------------------------------- |
| `DATABASE_URL`        | SQLite database file path          | `file:./data/dev.db`                    |
| `BETTER_AUTH_SECRET`  | Session encryption key (32+ chars) | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL`     | Base URL for auth callbacks        | `http://localhost:3000`                 |
| `NEXT_PUBLIC_APP_URL` | Public application URL             | `http://localhost:3000`                 |

### Optional for Development

| Variable                          | Description               | Required For                       |
| --------------------------------- | ------------------------- | ---------------------------------- |
| `RESEND_API_KEY`                  | Resend email API key      | Email sending (or logs to console) |
| `RESEND_FROM_EMAIL`               | Verified sender email     | Email sending                      |
| `BLOB_READ_WRITE_TOKEN`           | Vercel Blob storage token | File uploads                       |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key       | Address autocomplete               |

### Required for Production

All of the above variables MUST be set in Vercel dashboard for production deployments. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

## Deployment

The application is configured for deployment on Vercel with GitHub Actions CI/CD.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push to `main`

### Detailed Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions including:

- Vercel project setup
- GitHub Actions configuration
- External services setup (Resend, Vercel Blob)
- Environment variable configuration
- Post-deployment verification
- Troubleshooting guide
- Rollback procedures

## Documentation

- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- **Product Requirements**: See `docs/prd/` for detailed requirements
- **Architecture**: Technical architecture in `docs/architecture/`
- **Development Stories**: User stories in `docs/stories/`
- **Design**: UI/UX specifications in `docs/design/`

## Contributing

Please read our contributing guidelines before submitting pull requests. Ensure all tests pass and follow the established coding standards.

## License

[License Type] - See LICENSE file for details

## Support

For issues, questions, or feedback, please create an issue in the GitHub repository.

## Roadmap

### Epic 1: Foundation & Core Project Management ✅

- Project setup and infrastructure
- Database setup and schema
- Authentication system
- Project CRUD operations
- Basic cost tracking

### Epic 2: Financial Tracking & Contact Management 🚧

- Contact management system
- Cost-contact linkage
- Advanced cost categorization
- Cost filtering and search

### Epic 3: Document Management & Timeline 📋

- Document upload system
- Document storage and organization
- Timeline and event management
- Document-entity relationships

### Epic 4: Partner Transparency & Dashboards 📋

- Partner invitation system
- Role-based access control
- Partner dashboard
- Data visualizations

---

Built with Next.js, TypeScript, and modern web technologies for Australian real estate developers.
