# Contributing to Real Estate Development Tracker

Thank you for your interest in contributing to the Real Estate Development Tracker! This document provides guidelines and standards for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)
- [Documentation Standards](#documentation-standards)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- Bun package manager (recommended) or npm
- Git configured with your GitHub account
- Basic understanding of TypeScript, Next.js, and React

### Initial Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/realestate-portfolio.git
   cd realestate-portfolio
   ```

2. **Install Dependencies**

   ```bash
   bun install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with required values
   ```

4. **Database Setup**

   ```bash
   bun run db:migrate
   bun run db:seed  # Optional: sample data
   ```

5. **Verify Setup**
   ```bash
   bun run dev
   # Visit http://localhost:3000
   ```

See [Local Development Guide](docs/guides/local-development.md) for detailed setup instructions.

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

   Branch naming conventions:
   - `feature/` - New features or enhancements
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Test additions or updates

2. **Keep Branch Updated**

   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Push Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Process

1. **Before Starting Work**
   - Check existing issues/PRs to avoid duplication
   - Create an issue if one doesn't exist
   - Discuss approach for significant changes

2. **During Development**
   - Follow [Coding Standards](docs/architecture/coding-standards.md)
   - Write tests for new functionality
   - Update documentation as needed
   - Keep commits atomic and well-described

3. **Before Submitting PR**
   - Run all quality gates (see below)
   - Update relevant documentation
   - Ensure all tests pass
   - Rebase on latest main if needed

## Code Quality Standards

All code must pass these quality gates before merging:

### 1. Type Checking

```bash
bun run typecheck
```

- No TypeScript errors allowed
- Use strict mode (enabled in tsconfig.json)
- Avoid `any` type - use `unknown` or proper types

### 2. Linting

```bash
bun run lint
```

- Must pass ESLint with no errors
- Fix all warnings when possible
- Follow configured ESLint rules

### 3. Code Formatting

```bash
bun run format
```

- Code is auto-formatted with Prettier
- Husky pre-commit hook enforces formatting
- Consistent code style across project

### 4. Testing

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e
```

See [Testing Guide](docs/guides/testing.md) for detailed testing standards.

### Pre-commit Hooks

Husky and lint-staged automatically run on commit:

```bash
git commit -m "feat: add new feature"
# Automatically runs:
# - Type checking on TypeScript files
# - ESLint on staged files
# - Prettier formatting on all files
```

If pre-commit hooks fail, fix the issues before committing.

## Testing Requirements

### Minimum Test Coverage

All contributions must include appropriate tests:

1. **Unit Tests** (Required)
   - All tRPC procedures must have unit tests
   - Utility functions in `/lib` must be tested
   - Critical business logic must be covered

2. **Component Tests** (Required for UI)
   - All forms must have component tests
   - Interactive components must be tested
   - Test user interactions and error states

3. **Integration Tests** (Required for APIs)
   - Complete CRUD workflows must be tested
   - Test authentication and authorization
   - Verify data relationships

4. **E2E Tests** (Required for Critical Flows)
   - User authentication flow
   - Project creation and management
   - Cost entry and tracking

### Test File Organization

```
Frontend Tests:
  src/components/__tests__/
  src/hooks/__tests__/
  e2e/tests/

Backend Tests:
  src/server/__tests__/
  integration/api/__tests__/
```

### Writing Good Tests

```typescript
// ✅ Good: Descriptive, tests behavior
test("creates project with valid input and returns project object", async () => {
  const result = await createProject(validInput)
  expect(result).toMatchObject({ name: validInput.name })
})

// ❌ Bad: Vague, tests implementation
test("calls database", async () => {
  await createProject(input)
  expect(db.insert).toHaveBeenCalled()
})
```

See [Testing Guide](docs/guides/testing.md) for comprehensive examples.

## Pull Request Process

### Creating a Pull Request

1. **Ensure Quality**
   - All tests pass locally
   - Code is properly formatted
   - No linting errors
   - TypeScript compiles without errors

2. **Write Clear Description**

   ```markdown
   ## Description

   Brief description of changes and motivation

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - Describe testing performed
   - List test cases added

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-reviewed code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Added tests
   - [ ] All tests pass
   ```

3. **Link Related Issues**
   - Reference issues: "Fixes #123" or "Relates to #456"
   - Close issues automatically with keywords

### PR Review Guidelines

#### For Contributors

- Respond to feedback promptly
- Don't take criticism personally
- Ask questions if feedback is unclear
- Update PR based on review comments

#### For Reviewers

- Be respectful and constructive
- Explain the "why" behind suggestions
- Approve when code meets standards
- Request changes if issues exist

### PR Approval Process

1. **Automated Checks** (must pass)
   - GitHub Actions CI
   - Type checking
   - Linting
   - Test suite

2. **Code Review** (1 approval required)
   - Code quality and standards
   - Test coverage
   - Documentation updates

3. **Merge**
   - Squash and merge preferred
   - Use descriptive merge commit message
   - Delete branch after merge

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no code change)
- `refactor:` - Code refactoring (no feature change)
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (deps, config)
- `ci:` - CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(projects): add project duplication feature"

# Bug fix
git commit -m "fix(auth): resolve session timeout issue"

# Documentation
git commit -m "docs(api): add examples for cost endpoints"

# With body and footer
git commit -m "feat(costs): add bulk cost import

Implements CSV import for costs with validation
and error reporting.

Closes #123"
```

### Scope Guidelines

Common scopes:

- `auth` - Authentication/authorization
- `projects` - Project management
- `costs` - Financial tracking
- `ui` - UI components
- `api` - API/backend
- `db` - Database changes
- `config` - Configuration

## Documentation Standards

### Code Documentation

All code must be properly documented:

#### JSDoc for Functions

```typescript
/**
 * Creates a new real estate development project
 *
 * Validates project data, creates database record, and returns
 * the new project with proper access control.
 *
 * @param input - Project creation data
 * @param userId - ID of the authenticated user
 * @returns The newly created project
 * @throws {TRPCError} UNAUTHORIZED - User not authenticated
 * @throws {TRPCError} BAD_REQUEST - Invalid project data
 *
 * @example
 * const project = await createProject({
 *   name: "Sunset Renovation",
 *   address: { ... },
 *   startDate: new Date()
 * }, user.id);
 */
```

#### Component Documentation

```typescript
/**
 * ProjectCard - Displays project summary with key metrics
 *
 * Shows project name, address, status, and quick actions.
 * Includes cost summary and timeline preview.
 *
 * @param props.project - Project data to display
 * @param props.onEdit - Callback when edit is clicked
 * @param props.onDelete - Callback when delete is confirmed
 */
```

### Documentation Files

When adding features, update relevant documentation:

- **API changes:** Update `docs/api/README.md`
- **Component changes:** Update `docs/components/README.md`
- **Architecture changes:** Update `docs/architecture/`
- **User-facing changes:** Update main `README.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep table of contents updated
- Cross-reference related docs

## Getting Help

### Resources

- [Local Development Guide](docs/guides/local-development.md)
- [Testing Guide](docs/guides/testing.md)
- [Coding Standards](docs/architecture/coding-standards.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Troubleshooting Guide](docs/guides/troubleshooting.md)

### Support Channels

- **Questions:** Create GitHub Discussion
- **Bug Reports:** Create GitHub Issue with `bug` label
- **Feature Requests:** Create GitHub Issue with `enhancement` label
- **Security Issues:** Email security@example.com (private disclosure)

### Code of Conduct

- Be respectful and professional
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions
- Follow project standards

## Recognition

Contributors are recognized in:

- GitHub contribution graphs
- Release notes for significant contributions
- Project documentation (when appropriate)

Thank you for contributing to Real Estate Development Tracker! 🏗️
