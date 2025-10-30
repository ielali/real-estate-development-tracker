# Epic 8: Notifications & Comments - Brownfield Enhancement

## Epic Goal

Enable real-time collaboration and awareness by implementing a notification system for project updates and threaded comments on key entities, transforming the platform from passive tracking to active communication tool for development teams and partners.

## Epic Description

### Existing System Context

- **Current functionality:** Static data display, no real-time updates, no commenting
- **Authentication:** better-auth with RBAC (owners, partners, viewers)
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Technology stack:** Next.js 14 + TypeScript + tRPC + React Query
- **Email service:** Resend for transactional emails
- **Real-time needs:** Partners need to stay informed without constant login

### Enhancement Details

**What's being added/changed:**

- In-app notification center showing recent activity
- Email notifications for important events (configurable by user)
- Threaded comments on costs, documents, and timeline events
- Real-time notification badges using React Query polling

**How it integrates:**

- **Notifications:** New `notifications` table, tRPC subscriptions, email via Resend
- **Comments:** New `comments` table with foreign keys to costs/documents/events
- **UI:** Bell icon in header, comment threads below entities

**Success criteria:**

- Users receive notifications within 1 minute of triggering events
- Email notifications sent for critical updates (configurable)
- Users can comment on costs, documents, and timeline events
- Comment threads are visible to all project members
- Notification preferences can be customized per user

## Stories

### Story 8.1: In-App Notification System

**Objective:** Implement real-time notification center for project activity

**Tasks:**

- Create `notifications` table with schema:
  - id (uuid)
  - user_id (foreign key to users)
  - type (enum: cost_added, large_expense, document_uploaded, timeline_event, partner_invited, comment_added)
  - entity_type (enum: cost, document, timeline_event, project)
  - entity_id (uuid)
  - project_id (foreign key to projects)
  - message (text)
  - read (boolean, default false)
  - created_at (timestamp)
- Implement notification generation for key events:
  - New cost added (notify project owner and partners)
  - Large expense (>$10k threshold, immediate notification)
  - Document uploaded (notify all project members)
  - Timeline event created (notify all project members)
  - Partner invited/removed (notify affected partner)
  - Comment added (notify entity owner and thread participants)
- Create notification center UI:
  - Bell icon in header with unread count badge
  - Dropdown panel showing recent notifications (last 20)
  - Grouped by date (Today, Yesterday, This Week, Older)
  - Click notification to navigate to entity
- Mark notifications as read on click
- Implement React Query polling (30s interval) for real-time updates
- Add "Mark all as read" functionality
- Add notification preferences link in notification panel
- Implement notification cleanup (auto-delete after 90 days)

**Acceptance Criteria:**

- [ ] Notifications table created with proper schema and indexes
- [ ] Bell icon visible in header for all authenticated users
- [ ] Unread count badge displays correct number
- [ ] Notification panel opens on bell icon click
- [ ] Notifications grouped by date with clear sections
- [ ] Each notification shows icon, message, timestamp, read status
- [ ] Clicking notification navigates to entity and marks as read
- [ ] "Mark all as read" button works correctly
- [ ] New notifications appear within 30 seconds (polling interval)
- [ ] Notifications generated for all defined events
- [ ] Large expense threshold ($10k) triggers immediate notification
- [ ] Notification panel shows loading state during fetch
- [ ] Empty state displayed when no notifications
- [ ] Notifications respect RBAC (users only see their notifications)
- [ ] Notification cleanup job removes old notifications (>90 days)

### Story 8.2: Email Notifications with User Preferences

**Objective:** Implement configurable email notifications for critical events

**Tasks:**

- Create `notification_preferences` table with schema:
  - user_id (foreign key to users, primary key)
  - email_on_cost (boolean, default true)
  - email_on_large_expense (boolean, default true)
  - email_on_document (boolean, default true)
  - email_on_timeline (boolean, default true)
  - email_on_comment (boolean, default true)
  - email_digest_frequency (enum: immediate, daily, weekly, never)
  - updated_at (timestamp)
- Add notification settings page in user account:
  - Toggle switches for each notification type
  - Radio buttons for digest frequency
  - Save button with optimistic updates
- Implement email templates using Resend:
  - **Immediate Alert Template:** For large expenses, partner invitations
  - **Activity Update Template:** For costs, documents, timeline events
  - **Comment Notification Template:** For comment mentions and replies
  - **Daily Digest Template:** Summary of day's activity by project
  - **Weekly Digest Template:** Summary of week's activity by project
- Respect user preferences before sending emails:
  - Check preference for notification type
  - Batch notifications for digest mode
  - Skip emails for users with email_digest_frequency=never
- Include direct links to entities in email notifications
- Add unsubscribe link and preference management in emails
- Implement email rate limiting (max 10 immediate emails/hour per user)
- Create email sending queue (background job for digests)
- Add email delivery tracking (sent, delivered, failed)

**Acceptance Criteria:**

- [ ] Notification preferences table created with default values
- [ ] Notification settings page accessible from user menu
- [ ] All preference toggles work with immediate save
- [ ] Digest frequency selection persists correctly
- [ ] Email templates designed and tested in Resend
- [ ] Emails include project name, entity description, and direct link
- [ ] Large expense emails sent immediately regardless of digest setting
- [ ] Daily digests sent at 8 AM user's timezone
- [ ] Weekly digests sent Monday 8 AM user's timezone
- [ ] Unsubscribe link works and updates preferences
- [ ] Rate limiting enforced (10 immediate emails/hour)
- [ ] Email queue processes digests on schedule
- [ ] Email delivery tracked and logged
- [ ] Failed emails retried (up to 3 attempts)
- [ ] Emails tested across clients (Gmail, Outlook, Apple Mail)
- [ ] Email content is mobile-responsive

### Story 8.3: Threaded Comments on Entities

**Objective:** Enable collaborative discussions on costs, documents, and timeline events

**Tasks:**

- Create `comments` table with schema:
  - id (uuid)
  - user_id (foreign key to users)
  - entity_type (enum: cost, document, timeline_event)
  - entity_id (uuid)
  - project_id (foreign key to projects)
  - content (text, max 2000 characters)
  - parent_comment_id (uuid, nullable, foreign key to comments)
  - created_at (timestamp)
  - updated_at (timestamp)
  - deleted_at (timestamp, nullable, for soft delete)
- Add comment thread UI component (reusable):
  - Comment list sorted by created_at (oldest first)
  - Comment form at bottom (textarea + submit button)
  - Each comment shows: user avatar, name, timestamp, content
  - Reply button for each comment (one-level nesting only)
  - Edit/Delete buttons for own comments
  - "Edited" indicator if comment was modified
- Support nested replies (one level deep):
  - Parent comment with indented replies below
  - "Reply" form appears inline when reply button clicked
  - Cancel button to close reply form
- Add edit/delete permissions:
  - Users can edit/delete own comments
  - Project owners can delete any comment
  - Edit shows inline form with pre-filled content
  - Delete performs soft delete (deleted_at timestamp)
- Generate notifications when comments are added:
  - Notify entity owner
  - Notify all previous commenters in thread
  - Notify mentioned users (@username support)
- Real-time comment updates using React Query refetch (30s polling)
- Add comment count badge on entities
- Implement @mention autocomplete (search project members)
- Add markdown support for comments (bold, italic, links only)

**Acceptance Criteria:**

- [ ] Comments table created with proper schema and indexes
- [ ] Comment thread component displays below costs, documents, events
- [ ] Comments sorted chronologically (oldest first)
- [ ] New comment form visible at bottom of thread
- [ ] Comment submission creates comment and clears form
- [ ] Comment form has character counter (2000 max)
- [ ] User avatar, name, and timestamp display on each comment
- [ ] "Reply" button shows inline reply form with cancel option
- [ ] Nested replies indented and visually connected to parent
- [ ] One-level nesting enforced (no nested reply buttons on replies)
- [ ] Edit button works for own comments (inline edit form)
- [ ] Delete button works for own comments and project owner
- [ ] Deleted comments show "[Comment deleted]" placeholder
- [ ] "Edited" indicator shows if comment was modified
- [ ] Notifications generated for new comments
- [ ] Comment count badge shows on entity cards
- [ ] @mention autocomplete searches project members
- [ ] Mentioned users receive notifications
- [ ] Markdown rendering works (bold, italic, links)
- [ ] XSS protection implemented (sanitize HTML)
- [ ] Comments respect RBAC (only project members can comment)
- [ ] Real-time updates work (new comments appear within 30s)
- [ ] Empty state shows "No comments yet" with prompt

## Compatibility Requirements

- [x] Existing entity display remains unchanged (comments are additive)
- [x] Database schema: new tables with foreign keys to existing entities
- [x] UI changes follow Shadcn/ui patterns (Popover for notifications, Textarea for comments)
- [x] Performance: Notifications indexed by user_id and read status; Comments indexed by entity_type and entity_id
- [x] Email rate limiting to prevent spam (max 10 immediate emails/hour per user)
- [x] Polling intervals balanced for real-time feel without excessive server load

## Risk Mitigation

**Primary Risk:** Email notification spam overwhelming users or triggering email service limits

**Mitigation:** User preferences with defaults (digest mode for most events), rate limiting, clear unsubscribe options, Resend API monitoring for delivery rates

**Rollback Plan:** Notifications can be disabled via feature flag; emails can be paused independently via preference override; comments are read-only additive (can be hidden via UI toggle)

## Definition of Done

- [ ] All stories completed with acceptance criteria met
- [ ] Existing entity views verified (unchanged except for comment addition)
- [ ] Notification delivery tested (in-app and email)
- [ ] Email templates tested across email clients (Gmail, Outlook, Apple Mail)
- [ ] Email digests tested (daily and weekly)
- [ ] Comment threading tested with multiple users and nested replies
- [ ] Performance tested with high notification volume (1000+ notifications)
- [ ] Performance tested with long comment threads (100+ comments)
- [ ] Rate limiting tested for emails
- [ ] Polling intervals tested for server load impact
- [ ] XSS protection tested for comment content
- [ ] RBAC tested (users only see notifications/comments for their projects)
- [ ] Documentation: User guide for notifications, comment etiquette, email preferences
- [ ] No regression in existing features

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running Next.js 14 + TypeScript + tRPC + Resend + better-auth
- Integration points: Existing project/cost/document/timeline_event entities, Resend email service, React Query polling
- Existing patterns to follow: Shadcn/ui components (Popover, Textarea), tRPC mutations, Zod validation
- Critical compatibility requirements: Notifications are additive (no disruption to existing flows), email preferences must be respected, comments must be isolated per entity
- Each story must include verification that existing functionality remains intact
- Real-time considerations: Balance polling frequency with server load, ensure notification delivery within 1 minute

The epic should enable collaboration while maintaining system integrity and preventing notification fatigue."
