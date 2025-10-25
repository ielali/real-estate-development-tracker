# Development Guides

This directory contains practical guides for developing the Real Estate Development Tracker application.

## Available Guides

### [Local Development Setup](./local-development.md)

Complete guide for setting up the development environment:

- Prerequisites and tools installation
- Repository setup and configuration
- Environment variables configuration
- Database initialization
- Running the development server
- Common development tasks

**Use this guide:** When onboarding to the project or setting up a new development machine.

### [Testing Guide](./testing.md)

Comprehensive testing documentation:

- Test organization and file structure
- Unit testing with Vitest
- Component testing with Testing Library
- Integration testing patterns
- E2E testing with Playwright
- Running tests and checking coverage

**Use this guide:** When writing tests or debugging test failures.

### [Database Management Guide](./database.md)

Database operations and migration management:

- Database scripts overview (reset vs rebuild)
- Migration creation and best practices
- Troubleshooting migration issues
- Database connection details
- Emergency procedures

**Use this guide:** When working with database schema, migrations, or data management.

### [Deployment Guide](./deployment.md)

Deployment workflow and procedures:

- Netlify deployment process
- Environment configuration for production
- CI/CD pipeline overview
- External service setup
- Post-deployment verification
- Rollback procedures

**Use this guide:** When deploying to production or troubleshooting deployment issues.

### [Troubleshooting Guide](./troubleshooting.md)

Solutions for common issues:

- Development environment problems
- Build and deployment errors
- Database migration issues
- Authentication and session problems
- External service integration issues
- Performance debugging

**Use this guide:** When encountering errors or unexpected behavior.

## Quick Links

### Development Workflow

- [Contributing Guidelines](../../CONTRIBUTING.md)
- [Architecture Overview](../../ARCHITECTURE.md)
- [Coding Standards](../architecture/coding-standards.md)

### Technical Documentation

- [Tech Stack](../architecture/tech-stack.md)
- [API Documentation](../api/README.md)
- [Component Documentation](../components/README.md)

### Project Resources

- [Product Requirements](../prd/)
- [Architecture Docs](../architecture/)
- [Development Stories](../stories/)

## Getting Help

### Documentation Resources

1. Check the specific guide for your issue
2. Review [Troubleshooting Guide](./troubleshooting.md)
3. Search [GitHub Issues](https://github.com/your-org/realestate-portfolio/issues)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Support Channels

- **Development Issues:** Create GitHub issue with `bug` or `question` label
- **Feature Requests:** Create GitHub issue with `enhancement` label
- **Security Issues:** Follow responsible disclosure in CONTRIBUTING.md

## Contributing to Guides

When updating guides:

1. Keep examples practical and runnable
2. Include screenshots for UI-related steps
3. Update table of contents when adding sections
4. Cross-reference related documentation
5. Test all commands and code examples
6. Follow Markdown style guide in CONTRIBUTING.md

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.
