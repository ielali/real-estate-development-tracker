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
- **SQLite** with Drizzle migrations
- **Vercel** for hosting
- **Cloudflare R2/AWS S3** for document storage (when needed)
- **GitHub Actions** for CI/CD

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

- Node.js 18+ and npm
- Git
- SQLite

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd realestate-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Initialize the database:
```bash
npm run db:migrate
npm run db:seed  # Optional: Add sample data
```

5. Start the development server:
```bash
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

## Documentation

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