# Epic 6: Enhanced Security - Brownfield Enhancement

## Epic Goal

Strengthen platform security and data protection by implementing two-factor authentication and user-initiated backup capabilities, addressing security requirements as the platform transitions from MVP to production with real client data.

## Epic Description

### Existing System Context

- **Current authentication:** better-auth v1.3.13 with session management and RBAC
- **Database:** Neon PostgreSQL with automatic backups (platform-level)
- **Technology stack:** Next.js 14 + TypeScript + tRPC
- **Users:** Real estate developers and their partners with sensitive financial data

### Enhancement Details

**What's being added/changed:**

- Two-factor authentication (TOTP) for all user accounts
- User-initiated backup functionality allowing project owners to download complete project data snapshots

**How it integrates:**

- **2FA:** Extends better-auth authentication flow with optional/mandatory 2FA setup
- **Backups:** Creates new tRPC endpoint that exports project data (JSON) and document references

**Success criteria:**

- Users can enable 2FA in account settings
- Users can generate QR codes for authenticator apps
- Project owners can download complete project backups (JSON format)
- Backup includes all project data: costs, vendors, documents, timeline events
- Zero impact on existing authentication flows for users without 2FA

## Stories

### Story 6.1: Implement Two-Factor Authentication (2FA)

**Objective:** Add optional 2FA using TOTP for enhanced account security

**Tasks:**

- Add 2FA setup flow in user account settings
- Integrate TOTP (Time-based One-Time Password) using better-auth capabilities
- Create QR code generation for authenticator apps (Google Authenticator, Authy, etc.)
- Add 2FA challenge during login for enabled users
- Include backup codes for account recovery
- Add "Remember this device" option (30-day cookie)
- Create 2FA management UI (enable/disable, regenerate backup codes)

**Acceptance Criteria:**

- [ ] User can enable 2FA from account settings
- [ ] QR code generated for authenticator app setup
- [ ] Backup codes generated (10 codes) and displayed once
- [ ] Login flow prompts for 2FA code when enabled
- [ ] Backup codes work for authentication
- [ ] User can disable 2FA (requires current password + 2FA code)
- [ ] User can regenerate backup codes
- [ ] "Remember this device" option works for 30 days
- [ ] 2FA status visible on account settings
- [ ] Users without 2FA can login normally (no disruption)

### Story 6.2: User-Initiated Project Backup & Export

**Objective:** Enable project owners to download comprehensive data backups

**Tasks:**

- Create backup/export functionality for project owners
- Generate comprehensive JSON export of project data:
  - Project details (name, description, dates, budget)
  - All costs with category information
  - Vendors and contacts
  - Timeline events
  - Document metadata and download links
- Include document metadata (actual files remain in Netlify Blobs)
- Add UI in project settings for "Download Project Backup"
- Implement rate limiting to prevent abuse (max 5 backups per hour per user)
- Add backup download history (last 10 backups)
- Generate descriptive filename: `project-name-backup-YYYY-MM-DD-HHmmss.json`

**Acceptance Criteria:**

- [ ] "Download Project Backup" button in project settings
- [ ] Backup generates complete JSON with all project data
- [ ] JSON is well-formatted and human-readable
- [ ] Document metadata includes Netlify Blob URLs
- [ ] Rate limiting enforced (5 backups/hour/user)
- [ ] Error message shown if rate limit exceeded
- [ ] Backup history displayed (date, file size)
- [ ] Only project owners can download backups (RBAC enforced)
- [ ] Large projects (1000+ costs) export successfully (<10s)
- [ ] Backup includes schema version for future compatibility

### Story 6.3: Backup Management & Security Enhancements

**Objective:** Add activity logging and administrative oversight for security features

**Tasks:**

- Add activity logging for security events:
  - 2FA enabled/disabled
  - 2FA login attempts (success/failure)
  - Backup codes generated/used
  - Project backups downloaded
- Create user notification for security actions (email via Resend):
  - "2FA has been enabled on your account"
  - "2FA has been disabled on your account"
  - "Backup code was used to login"
  - "Project backup was downloaded"
- Add admin visibility into 2FA adoption rates (dashboard metric)
- Document backup restoration process for customer support
- Create security settings page (consolidate 2FA + activity log)

**Acceptance Criteria:**

- [ ] All security events logged to database (security_events table)
- [ ] Activity log visible in security settings (last 50 events)
- [ ] Email notifications sent for critical security events
- [ ] Admin dashboard shows 2FA adoption percentage
- [ ] Documentation created for backup restoration process
- [ ] Security settings page consolidates 2FA and activity log
- [ ] Activity log shows: event type, timestamp, IP address, device
- [ ] Activity log is read-only (users cannot delete entries)

## Compatibility Requirements

- [x] Existing authentication APIs remain unchanged for non-2FA users
- [x] Database schema changes are backward compatible (add 2FA columns to users table, add security_events table)
- [x] UI changes follow existing Shadcn/ui patterns
- [x] Performance impact is minimal (2FA check only on login, backups are on-demand)
- [x] better-auth session management continues working as-is

## Risk Mitigation

**Primary Risk:** Users locked out of accounts if they lose 2FA device

**Mitigation:** Implement backup codes during 2FA setup, provide clear recovery documentation, admin ability to disable 2FA for locked-out users

**Rollback Plan:** 2FA can be disabled per-user via direct database update if needed; backup feature can be feature-flagged off

## Definition of Done

- [ ] All stories completed with acceptance criteria met
- [ ] Existing authentication flows verified (users without 2FA unaffected)
- [ ] Integration tested with better-auth session management
- [ ] Backup export tested with large projects (performance acceptable)
- [ ] 2FA tested with multiple authenticator apps (Google, Authy, Microsoft)
- [ ] Backup codes tested for account recovery
- [ ] Email notifications tested and delivered successfully
- [ ] Rate limiting tested and enforced
- [ ] Documentation updated (user guide for 2FA setup, backup restoration)
- [ ] No regression in existing authentication or authorization features

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing authentication system running better-auth v1.3.13 with Next.js 14
- Integration points: better-auth session management, Neon PostgreSQL database, Resend email service
- Existing patterns to follow: Shadcn/ui components, tRPC API routes, Zod validation
- Critical compatibility requirements: Users without 2FA must not be affected, all existing auth flows continue working
- Each story must include verification that existing functionality remains intact
- Security is critical: follow OWASP best practices for 2FA and backup code storage

The epic should enhance security while maintaining a seamless experience for existing users."
