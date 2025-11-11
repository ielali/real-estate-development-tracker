# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date       | Story | Epic | Type          | Severity | Owner   | Status   | Notes                                                                                                                                                                                  |
| ---------- | ----- | ---- | ------------- | -------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-11-11 | 10.3  | 10   | Testing       | Low      | TBD     | Open     | Add Playwright E2E test for keyboard shortcut (Cmd/Ctrl+B) cross-browser verification. File: apps/web/src/components/layout/Sidebar.tsx:88-99                                          |
| 2025-11-11 | 10.3  | 10   | Documentation | Low      | TBD     | Open     | Document dashboard demo page purpose (developer showcase vs production feature). File: apps/web/src/app/dashboard/page.tsx                                                             |
| 2025-11-11 | 10.3  | 10   | Testing       | Low      | TBD     | Open     | Implement automated performance monitoring for animation frame rates in CI/CD pipeline. Currently verified manually with Chrome DevTools.                                              |
| 2025-11-11 | 10.3  | 10   | Enhancement   | Low      | TBD     | Open     | Add `prefers-reduced-motion` media query support to respect user animation preferences for accessibility.                                                                              |
| 2025-11-12 | 10.7  | 10   | Process       | High     | Bitwave | Resolved | ✅ FIXED: All subtasks in Tasks 2-11 now marked complete [x] to reflect actual implementation state. File: docs/stories/10.7.story.md:50-160                                           |
| 2025-11-12 | 10.7  | 10   | Bug/TechDebt  | Medium   | Bitwave | Resolved | ✅ VERIFIED: FileUpload component properly handles camera permissions via capture="environment" attribute (HTML5 standard). File: apps/web/src/components/documents/FileUpload.tsx:426 |
