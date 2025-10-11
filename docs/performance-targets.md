# Performance Targets

This document defines the performance benchmarks and targets for the Real Estate Development Tracker application. These targets ensure optimal user experience across all devices, with special emphasis on mobile performance.

## Core Web Vitals Targets

Core Web Vitals are Google's standardized metrics for measuring real-world user experience. All targets align with Google's "Good" thresholds.

| Metric                             | Target  | Description                                    | Priority |
| ---------------------------------- | ------- | ---------------------------------------------- | -------- |
| **LCP** (Largest Contentful Paint) | < 2.5s  | Time until largest content element is visible  | Critical |
| **FID** (First Input Delay)        | < 100ms | Time from user interaction to browser response | Critical |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | Visual stability (no unexpected layout shifts) | High     |
| **TTI** (Time to Interactive)      | < 3.5s  | Time until page is fully interactive           | High     |
| **FCP** (First Contentful Paint)   | < 1.8s  | Time until first content appears               | Medium   |

## Page Load Time Targets

Target load times for key application routes, measured on 4G mobile connection with 4x CPU throttling (representing typical mobile use cases).

### Critical User Paths

| Route                      | Target Load Time | Description         | Rationale                                     |
| -------------------------- | ---------------- | ------------------- | --------------------------------------------- |
| `/` (Home)                 | < 2.0s           | Landing page        | First impression critical for user engagement |
| `/projects`                | < 2.5s           | Project list        | High-frequency page; must feel instant        |
| `/projects/[id]`           | < 2.5s           | Project detail      | Core workflow page; frequent navigation       |
| `/projects/[id]/costs`     | < 2.0s           | Cost entry list     | Mobile-first; data entry happens here         |
| `/projects/[id]/costs/new` | < 1.5s           | Cost entry form     | Critical path; users are actively working     |
| `/dashboard`               | < 3.0s           | Dashboard analytics | Data-heavy; acceptable slightly slower        |

### Secondary Paths

| Route           | Target Load Time | Description    |
| --------------- | ---------------- | -------------- | ------------------------------- |
| `/auth/sign-in` | < 1.5s           | Authentication | Security-critical; must be fast |
| `/auth/sign-up` | < 1.5s           | Registration   | Onboarding experience           |
| `/profile`      | < 2.0s           | User profile   | Infrequent access               |
| `/settings`     | < 2.0s           | App settings   | Infrequent access               |

## Bundle Size Budgets

Bundle size directly impacts load time. These budgets ensure optimal performance on mobile devices with slower networks.

### JavaScript Bundles

| Bundle Type           | Target Size | Maximum Size | Current Baseline           |
| --------------------- | ----------- | ------------ | -------------------------- |
| **Initial Bundle**    | < 200KB     | 250KB        | _TBD on first measurement_ |
| **Per-Route Chunk**   | < 75KB      | 100KB        | _TBD on first measurement_ |
| **Vendor Bundle**     | < 150KB     | 200KB        | _TBD on first measurement_ |
| **Shared Components** | < 50KB      | 75KB         | _TBD on first measurement_ |

### Asset Budgets

| Asset Type          | Target  | Maximum | Notes                                   |
| ------------------- | ------- | ------- | --------------------------------------- |
| **Total Page Size** | < 1.5MB | 2.0MB   | Including all assets on initial load    |
| **Images per Page** | < 500KB | 750KB   | Use Next.js Image optimization          |
| **Fonts**           | < 100KB | 150KB   | WOFF2 format, subset to used characters |
| **CSS**             | < 50KB  | 75KB    | Tailwind purges unused styles           |

## API Response Time Targets

Backend performance targets ensure responsive user interactions and data operations.

### Standard Operations

| Operation Type       | Target  | Maximum | Description                              |
| -------------------- | ------- | ------- | ---------------------------------------- |
| **Data Fetch**       | < 200ms | 500ms   | tRPC queries (projects, costs, partners) |
| **Simple Mutation**  | < 300ms | 600ms   | Create/update single record              |
| **Complex Mutation** | < 500ms | 1000ms  | Multi-step operations with validation    |
| **Search/Filter**    | < 300ms | 600ms   | Database queries with joins              |
| **Authentication**   | < 400ms | 800ms   | Session validation and user lookup       |

### Cached Operations

| Operation Type  | Target  | Maximum | Notes                             |
| --------------- | ------- | ------- | --------------------------------- |
| **Cached Data** | < 100ms | 200ms   | React Query cache hit             |
| **Static Data** | < 50ms  | 100ms   | Categories, enums, reference data |

## Mobile Performance Considerations

Mobile performance is prioritized as cost tracking and updates frequently occur on-site using mobile devices.

### Mobile-Specific Targets

- **Touch Response:** < 100ms from touch to visual feedback
- **Scroll Performance:** 60fps smooth scrolling (no jank)
- **Form Input Delay:** < 50ms from keypress to character display
- **Image Load:** Progressive loading with blur placeholder
- **Network Resilience:** Graceful degradation on slow 3G

### Mobile Testing Configuration

All performance tests run with mobile simulation:

- **Device:** Simulated Moto G4 (representative mid-range Android)
- **Network:** 4G throttling (1.6Mbps down, 750Kbps up, 150ms RTT)
- **CPU:** 4x slowdown (represents typical mobile CPU constraints)
- **Viewport:** 375px width (minimum supported mobile width)

## Lighthouse Performance Thresholds

GitHub Actions CI pipeline enforces these Lighthouse scores on every PR:

| Category           | Minimum Score | Target Score | Notes                                       |
| ------------------ | ------------- | ------------ | ------------------------------------------- |
| **Performance**    | 85            | 90+          | Can fluctuate ±5 due to network variance    |
| **Accessibility**  | 100           | 100          | Zero tolerance; WCAG AA compliance required |
| **Best Practices** | 95            | 100          | Security, HTTPS, modern APIs                |
| **SEO**            | 90            | 100          | Meta tags, semantic HTML                    |

### Lighthouse Test Pages

CI tests these critical pages on every build:

1. Home page (`/`)
2. Projects list (`/projects`)
3. Project detail page (with mock data)
4. Cost entry form (with mock project)

## Performance Monitoring Strategy

### Continuous Monitoring

- **Netlify Speed Insights:** Real-user monitoring (RUM) for Core Web Vitals
- **Next.js Analytics:** Server-side rendering performance metrics
- **React Query DevTools:** Client-side data fetching performance
- **Lighthouse CI:** Automated performance regression detection

### Performance Budgets Enforcement

CI pipeline fails the build if:

- Lighthouse performance score < 85
- Bundle size increases > 10KB without justification
- Any Core Web Vitals exceed targets
- Accessibility score < 100

### Performance Optimization Workflow

1. **Measure:** Lighthouse CI + bundle analyzer on every PR
2. **Alert:** Automated PR comments show performance changes
3. **Analyze:** Bundle analyzer treemap identifies large dependencies
4. **Optimize:** Code splitting, lazy loading, image optimization
5. **Verify:** Re-run Lighthouse to confirm improvement

## Baseline Metrics

_To be populated on first CI run with Lighthouse CI_

### Current Performance Baseline

| Metric               | Home | Projects | Project Detail | Cost Entry |
| -------------------- | ---- | -------- | -------------- | ---------- |
| **Lighthouse Score** | TBD  | TBD      | TBD            | TBD        |
| **LCP**              | TBD  | TBD      | TBD            | TBD        |
| **FID**              | TBD  | TBD      | TBD            | TBD        |
| **CLS**              | TBD  | TBD      | TBD            | TBD        |
| **Bundle Size**      | TBD  | TBD      | TBD            | TBD        |

**Note:** Baseline will be established after first successful Lighthouse CI run and updated quarterly.

## Optimization Opportunities

### Quick Wins (Already Implemented)

- ✅ Next.js automatic code splitting
- ✅ Tailwind CSS purging unused styles
- ✅ React Query caching strategy (5-minute stale time)
- ✅ tRPC type-safe API eliminates runtime validation overhead

### Future Optimizations (Backlog)

- Dynamic imports for heavy components (charts, maps)
- Image optimization with Next.js Image component
- Service worker for offline cost entry caching
- Route prefetching for predictable navigation
- Database query optimization with proper indexes
- Redis caching layer for frequently accessed data

## Performance Testing Checklist

Before deploying to production, verify:

- [ ] Lighthouse CI passes all thresholds
- [ ] Bundle size within budgets
- [ ] Core Web Vitals meet targets on real devices
- [ ] Mobile 4G performance acceptable (manual testing)
- [ ] No console errors or warnings
- [ ] React Query cache hit rate > 80%
- [ ] API response times within targets (check logs)
- [ ] No performance regressions vs previous release

---

**Last Updated:** 2025-10-11
**Review Cadence:** Quarterly or when performance issues detected
**Owner:** Development Team
