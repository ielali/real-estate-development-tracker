# Testing Report Generation Locally

This guide shows you how to test the PDF and Excel report generation feature in your local development environment.

## Prerequisites

- Development server running: `npm run dev`
- A project with some data (costs, vendors, events, documents)

## Step 1: Start the Development Server

```bash
cd apps/web
npm run dev
```

You should see this log message indicating local storage is active:

```
📦 Local Blob Store initialized: "reports" (file system storage at /path/to/project/apps/web/.blobs/reports)
```

**Local Development Features:**

- Generated reports persist in `.blobs/reports/` directory (gitignored)
- Reports survive server restarts
- You can open PDFs/Excel files directly from `.blobs/reports/` folder for manual inspection
- Easier debugging of report content
- Automatic cleanup of files older than 24 hours

## Step 2: Navigate to a Project

1. Open your browser: http://localhost:3000
2. Log in to your account
3. Navigate to any project that has some costs/data

## Step 3: Generate a Report

### Via UI:

1. Click the **"Generate Report"** button on the project page
2. Choose report format (PDF or Excel)
3. Optionally select a date range
4. Click **"Generate"**
5. Download the generated report

### Via API (using curl):

**Generate PDF:**

```bash
curl -X POST http://localhost:3000/api/trpc/reports.generateReport \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "projectId": "your-project-id",
    "format": "pdf",
    "startDate": null,
    "endDate": null
  }'
```

**Generate Excel:**

```bash
curl -X POST http://localhost:3000/api/trpc/reports.generateReport \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "projectId": "your-project-id",
    "format": "excel",
    "startDate": null,
    "endDate": null
  }'
```

## Step 4: Verify the Report

### Check Console Logs

You should see logs like:

```
📦 Local Blob Store initialized: "reports" (in-memory storage)
✅ Local Blob Store: SET abc123/project-report-1234567890.pdf (245678 bytes)
Loading logo from: /Users/you/project/apps/web/public/logo.png
Logo loaded successfully, data URI length: 301382
```

### Download and Open

1. Click the download link in the UI
2. Open the PDF in your PDF viewer or Excel in Microsoft Excel/LibreOffice
3. Verify content:
   - **PDF**: Check for logo, project details, cost breakdown, charts
   - **Excel**: Check all 5 sheets (Summary, Detailed Costs, Vendors, Timeline, Documents)

## Expected Behavior

### ✅ What Works

- Full PDF generation with charts (Pie, Bar, Timeline)
- Full Excel generation with 5 sheets
- Date range filtering
- Partner view watermarking (for non-owner users)
- Report download (via temporary in-memory storage)
- Report expiry (24-hour metadata tracking)

### ⚠️ Limitations (Local Development Only)

**Local File System Storage:**

- Reports persist in `.blobs/reports/` directory (gitignored)
- Survives server restarts
- Files auto-expire after 24 hours
- Great for manual inspection and debugging

For production-like testing with real Netlify infrastructure, use:

- Netlify Deploy Previews (automatic real Blobs)
- Real Netlify Blobs locally (see [netlify-blobs-setup.md](netlify-blobs-setup.md))

## Troubleshooting

### "Report generation failed"

**Check:**

1. Project has data (costs, categories, etc.)
2. Database migrations are up to date: `npm run db:migrate`
3. Logo file exists at `public/logo.png`

### "Download link doesn't work"

**Solution:**

- The download endpoint isn't implemented yet (known limitation)
- Reports are generated and stored, but download requires the download API route
- For now, verify generation via console logs and test suite

### Charts not appearing in PDF

**Solution:**

- Ensure project has costs in multiple categories (for pie chart)
- Ensure project has multiple vendors (for bar chart)
- Check console for chart rendering logs

## Running Tests Instead

If you prefer automated testing over manual testing:

```bash
# Run all report tests
npm run test:run -- src/server/api/routers/__tests__/reports.test.ts \
                    src/server/services/__tests__/report-pdf.service.test.tsx \
                    src/server/services/__tests__/report-excel.service.test.ts \
                    src/components/reports/__tests__/ReportOptionsModal.test.tsx

# Quick test (just the router)
npm run test:run -- src/server/api/routers/__tests__/reports.test.ts
```

**Test coverage:** 67 tests covering:

- PDF generation with charts
- Excel generation with 5 sheets
- Authorization (owner/partner)
- Date filtering
- Error handling
- Edge cases

## Next Steps

1. ✅ Test report generation locally (this guide)
2. 🚀 Test in Netlify Deploy Preview (push to GitHub, create PR)
3. 📊 Test in production (merge and deploy)

For production deployment, reports use real Netlify Blobs with automatic configuration!
