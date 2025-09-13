# Unified Project Structure

Turborepo monorepo structure accommodating both frontend and backend with shared packages:

```
realestate-portfolio/
├── .github/workflows/              # CI/CD workflows
│   ├── ci.yaml
│   └── deploy.yaml
├── apps/
│   └── web/                       # Next.js fullstack application
│       ├── src/
│       │   ├── app/               # App Router pages and layouts
│       │   ├── components/        # UI components (Shadcn/ui based)
│       │   ├── server/            # tRPC routers and context
│       │   ├── lib/               # Utilities and configurations
│       │   └── styles/            # Global styles and Tailwind
│       ├── public/                # Static assets
│       ├── drizzle/               # Database migrations
│       └── package.json
├── packages/
│   ├── shared/                    # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/             # Data models and interfaces
│   │   │   ├── constants/         # Category definitions
│   │   │   ├── validators/        # Zod schemas
│   │   │   └── utils/             # Shared utility functions
│   │   └── package.json
│   ├── ui/                        # Shared UI components
│   │   └── src/components/        # Reusable Shadcn/ui components
│   └── config/                    # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
├── docs/                          # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── .env.example                   # Environment template
├── package.json                   # Root package.json
├── turbo.json                     # Turborepo configuration
└── README.md
```
