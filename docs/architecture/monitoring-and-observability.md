# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Netlify Analytics + Netlify Speed Insights
- **Backend Monitoring:** Netlify Functions analytics + custom logging
- **Error Tracking:** Sentry for both frontend and backend errors (planned)
- **Performance Monitoring:** Core Web Vitals tracking + React Profiler
- **Database Monitoring:** Neon PostgreSQL built-in metrics and query insights

## Analytics Platform

**Netlify Analytics:**

- Server-side analytics (no JavaScript required)
- Privacy-friendly, GDPR compliant
- Page views and unique visitor tracking
- Bandwidth and resource usage monitoring
- Available on Netlify Pro plan and above

**Netlify Speed Insights:**

- Core Web Vitals monitoring (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Performance trends over time
- Device and browser breakdown
- Geographic performance insights

## Key Metrics

**Frontend Metrics:**

- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and unhandled rejections
- API response times and error rates
- User interactions and conversion rates
- Page load times by route
- Time to Interactive (TTI)

**Backend Metrics:**

- Request rate and response times
- Error rate by endpoint
- Database query performance
- Authentication success/failure rates
- Serverless function execution times
- Cold start frequency and duration

**Database Metrics (Neon):**

- Connection pool utilization
- Query execution times
- Database size and growth
- Active connections count
- Cache hit ratio
- Replication lag (if applicable)

**Business Metrics:**

- Cost entries per day/week
- Partner dashboard usage
- Document uploads per project
- User retention and engagement
- Project creation rate
- Active users (daily/weekly/monthly)

## Error Tracking (Planned)

**Sentry Integration:**

- Frontend error capture and reporting
- Backend exception tracking
- Performance transaction monitoring
- Release tracking and deployment correlation
- User feedback collection
- Error alerting and notifications

**Setup (Future Story):**

```bash
# Install Sentry SDK
bun add @sentry/nextjs

# Configure in next.config.js
# Add SENTRY_DSN to environment variables
```

## Logging Strategy

**Application Logs:**

- Structured JSON logging for easy parsing
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/response logging for API routes
- User action tracking for audit trails

**Netlify Function Logs:**

- Automatic function execution logging
- Available in Netlify dashboard
- Can be forwarded to external services (Datadog, LogDNA)
- Retention based on plan level

**Database Logs (Neon):**

- Query performance logs
- Connection events
- Error logs
- Available in Neon dashboard

## Custom Logging Implementation

```typescript
// apps/web/src/lib/logger.ts
export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: "ERROR",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    )
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(
      JSON.stringify({
        level: "WARN",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    )
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        JSON.stringify({
          level: "INFO",
          message,
          timestamp: new Date().toISOString(),
          ...meta,
        })
      )
    }
  },
}
```

## Performance Monitoring

**Frontend Performance:**

- Next.js built-in Web Vitals reporting
- Custom performance marks and measures
- React Profiler for component rendering analysis
- Bundle size tracking with next/bundle-analyzer

**Backend Performance:**

- tRPC request duration tracking
- Database query performance monitoring via Drizzle
- Neon query insights for slow queries
- Serverless function execution metrics

**Monitoring Dashboard Access:**

1. **Netlify Dashboard** → Your Site → Analytics
2. **Netlify Dashboard** → Your Site → Functions (for serverless metrics)
3. **Neon Dashboard** → Your Project → Monitoring
4. **GitHub Actions** → Workflow runs (for CI/CD metrics)

## Alerting Strategy (Future Enhancement)

**Critical Alerts:**

- Production deployment failures
- Error rate spike (>5% of requests)
- Database connection failures
- Authentication system downtime

**Warning Alerts:**

- Elevated error rate (>1% of requests)
- Slow API response times (>2s p95)
- High database query times (>500ms p95)
- Increased serverless cold starts

**Alert Channels:**

- Email notifications
- Slack integration (via Netlify)
- PagerDuty for critical incidents (enterprise)

## Health Checks

**Application Health:**

- `/api/health` endpoint for basic health check
- Database connectivity verification
- External service availability check

**Automated Monitoring:**

- Netlify synthetic monitoring (Pro plan)
- External uptime monitoring (e.g., UptimeRobot, Pingdom)
- Geographic availability testing

## Data Retention

**Netlify Logs:**

- Function logs: 7 days (Starter), 30 days (Pro)
- Analytics data: 30 days (Pro), 12 months (Enterprise)

**Neon Metrics:**

- Real-time metrics: 7 days
- Historical metrics: 30 days
- Query insights: 14 days

**Application Logs:**

- Local development: Not persisted
- Production: Forward to external service for long-term storage

## Privacy and Compliance

**GDPR Compliance:**

- Netlify Analytics is privacy-first (no cookies)
- No personal data in analytics
- User data encrypted in transit and at rest

**Data Protection:**

- SSL/TLS for all connections
- Environment variable encryption
- Database encryption at rest (Neon)

---

**Architecture Document Complete**

This comprehensive monitoring and observability strategy ensures production readiness for the Real Estate Development Tracker, with clear visibility into application health, performance, and user behavior using Netlify's integrated tools and Neon's database monitoring capabilities.
