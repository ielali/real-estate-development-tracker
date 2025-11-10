# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date       | Story | Epic | Type          | Severity | Owner | Status | Notes                                                                                                                                         |
| ---------- | ----- | ---- | ------------- | -------- | ----- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-11-11 | 10.3  | 10   | Testing       | Low      | TBD   | Open   | Add Playwright E2E test for keyboard shortcut (Cmd/Ctrl+B) cross-browser verification. File: apps/web/src/components/layout/Sidebar.tsx:88-99 |
| 2025-11-11 | 10.3  | 10   | Documentation | Low      | TBD   | Open   | Document dashboard demo page purpose (developer showcase vs production feature). File: apps/web/src/app/dashboard/page.tsx                    |
| 2025-11-11 | 10.3  | 10   | Testing       | Low      | TBD   | Open   | Implement automated performance monitoring for animation frame rates in CI/CD pipeline. Currently verified manually with Chrome DevTools.     |
| 2025-11-11 | 10.3  | 10   | Enhancement   | Low      | TBD   | Open   | Add `prefers-reduced-motion` media query support to respect user animation preferences for accessibility.                                     |
