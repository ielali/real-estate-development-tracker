# API Documentation

This directory contains documentation for the Real Estate Development Tracker API.

## Overview

The application uses [tRPC](https://trpc.io/) for type-safe API communication between frontend and backend. All API routes are defined as tRPC procedures with automatic TypeScript type inference.

## API Structure

### Authentication

- **Router:** `auth`
- **Location:** `apps/web/src/server/api/routers/auth.ts`
- **Purpose:** User authentication, session management, and authorization

### Projects

- **Router:** `projects`
- **Location:** `apps/web/src/server/api/routers/projects.ts`
- **Purpose:** CRUD operations for real estate development projects

### Costs

- **Router:** `costs`
- **Location:** `apps/web/src/server/api/routers/costs.ts`
- **Purpose:** Financial tracking for project costs and expenses

## Documentation Standards

### Procedure Documentation Format

All tRPC procedures should include JSDoc comments following this pattern:

```typescript
/**
 * Creates a new real estate development project
 *
 * Validates project data, creates database record, and returns the new project
 * with proper access control for the authenticated user.
 *
 * @throws {TRPCError} UNAUTHORIZED - User not authenticated
 * @throws {TRPCError} BAD_REQUEST - Invalid project data
 * @returns {Project} The newly created project
 *
 * @example
 * const project = await trpc.projects.create.mutate({
 *   name: "Sunset Boulevard Renovation",
 *   address: {
 *     streetNumber: "123",
 *     streetName: "Sunset Blvd",
 *     suburb: "Hollywood",
 *     state: "NSW",
 *     postcode: "2000",
 *     formatted: "123 Sunset Blvd, Hollywood NSW 2000"
 *   },
 *   startDate: new Date("2025-01-01"),
 *   projectType: "renovation"
 * });
 */
create: protectedProcedure
  .input(createProjectSchema)
  .mutation(async ({ ctx, input }) => {
    // Implementation...
  }),
```

### Request/Response Examples

Each router file should include example requests and responses:

```typescript
// Example Request
const input = {
  name: "Coastal Development",
  address: {
    /* ... */
  },
  startDate: new Date(),
  projectType: "new_build",
}

// Example Response
const response = {
  id: "uuid-here",
  name: "Coastal Development",
  ownerId: "user-uuid",
  createdAt: new Date(),
  // ... other fields
}
```

### Error Handling

Document all possible error codes:

- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission for resource
- `BAD_REQUEST` - Invalid input data
- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Operation conflicts with existing data
- `INTERNAL_SERVER_ERROR` - Unexpected server error

## Testing API Endpoints

See [Testing Guide](../guides/testing.md) for examples of:

- Unit testing tRPC procedures
- Integration testing complete workflows
- Mocking database calls for isolated tests

## Related Documentation

- [Architecture Overview](../../ARCHITECTURE.md)
- [Development Workflow](../../CONTRIBUTING.md)
- [Testing Guide](../guides/testing.md)
- [Coding Standards](../architecture/coding-standards.md)
