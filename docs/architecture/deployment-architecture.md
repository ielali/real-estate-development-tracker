# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (optimized for Next.js)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (automatic)
- **CDN/Edge:** Vercel Edge Network with automatic optimization

**Backend Deployment:**
- **Platform:** Vercel Serverless Functions (Next.js API routes)
- **Build Command:** Same as frontend (integrated)
- **Deployment Method:** Git-based automatic deployment

**Database Deployment:**
- **Development:** Local SQLite file
- **Production:** Vercel Postgres or Turso (hosted SQLite)
- **Migrations:** Automated via Drizzle Kit in CI/CD

## CI/CD Pipeline

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3000/api | Local development |
| Preview | https://[branch]-realestate-portfolio.vercel.app | Same (integrated) | PR previews |
| Production | https://realestate-portfolio.vercel.app | Same (integrated) | Live environment |
