# Security and Performance

## Security Requirements

**Frontend Security:**

- **CSP Headers:** `default-src 'self'; img-src 'self' blob: data:; script-src 'self' 'unsafe-inline'`
- **XSS Prevention:** React's built-in XSS protection + content sanitization for user inputs
- **Secure Storage:** JWT tokens in httpOnly cookies, sensitive data never in localStorage

**Backend Security:**

- **Input Validation:** Zod schemas on all tRPC procedures with runtime validation
- **Rate Limiting:** 100 requests/minute per IP, 1000/hour per authenticated user
- **CORS Policy:** Restricted to application domain with credentials support

**Authentication Security:**

- **Token Storage:** JWT in httpOnly cookies with SameSite=Strict
- **Session Management:** Better-auth with 30-day expiration, automatic refresh
- **Password Policy:** Minimum 8 characters, enforced via Better-auth configuration

## Performance Optimization

**Frontend Performance:**

- **Bundle Size Target:** <250KB initial bundle, <100KB per route
- **Loading Strategy:** Progressive loading with React.lazy() and Suspense boundaries
- **Caching Strategy:** React Query with 5-minute stale time, background refetching

**Backend Performance:**

- **Response Time Target:** <500ms for API calls, <200ms for cached data
- **Database Optimization:** Drizzle query optimization with proper indexes
- **Caching Strategy:** In-memory caching for categories, Redis for scaling
