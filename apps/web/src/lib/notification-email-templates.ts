/**
 * Notification Email Templates
 * Story 8.2: Email notification templates for project activities
 */

export interface CostEmailData {
  userName: string
  projectName: string
  projectId: string
  costDescription: string
  amount: number // in cents
  costId: string
  recipientEmail: string
  unsubscribeToken: string
}

export interface LargeExpenseEmailData extends CostEmailData {
  // Same as CostEmailData but semantically different
}

export interface DocumentEmailData {
  userName: string
  projectName: string
  projectId: string
  fileName: string
  documentId: string
  recipientEmail: string
  unsubscribeToken: string
}

export interface TimelineEventEmailData {
  userName: string
  projectName: string
  projectId: string
  eventTitle: string
  eventDate: Date
  eventId: string
  recipientEmail: string
  unsubscribeToken: string
}

export interface CommentEmailData {
  userName: string
  projectName: string
  projectId: string
  entityType: string
  entityName: string
  commentPreview: string
  entityId: string
  recipientEmail: string
  unsubscribeToken: string
}

export interface DigestNotification {
  type: string
  message: string
  entityId: string
  createdAt: Date
}

export interface DailyDigestEmailData {
  userName: string
  recipientEmail: string
  date: Date
  projects: Array<{
    projectName: string
    projectId: string
    notifications: DigestNotification[]
  }>
  unsubscribeToken: string
}

export interface WeeklyDigestEmailData extends DailyDigestEmailData {
  weekStart: Date
  weekEnd: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amountInCents / 100)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(date)
}

/**
 * Base email template wrapper with consistent styling
 */
function wrapEmailTemplate(title: string, content: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 32px 24px;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 24px 0;
        }
        .button:hover {
            background: #2563eb;
        }
        .footer {
            background: #f3f4f6;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .highlight {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 16px 0;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        .large-expense {
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 16px;
            margin: 16px 0;
        }
        .large-expense .amount {
            color: #dc2626;
        }
        @media only screen and (max-width: 600px) {
            .container {
                border-radius: 0;
            }
            .content {
                padding: 24px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This email was sent from Real Estate Portfolio</p>
            <p>You received this email because you are a member of this project.</p>
            <p><a href="${unsubscribeUrl}">Unsubscribe from these emails</a></p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Cost Added Email
 */
export function generateCostAddedHTML(data: CostEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=costs&costId=${data.costId}`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const content = `
    <p>Hi there,</p>
    <p><strong>${data.userName}</strong> added a new cost to <strong>${data.projectName}</strong>:</p>
    <div class="highlight">
      <p class="amount">${formatCurrency(data.amount)}</p>
      <p><strong>${data.costDescription}</strong></p>
    </div>
    <p>
      <a href="${projectUrl}" class="button">View Cost Details</a>
    </p>
    <p>Click the button above to view the cost in your project dashboard.</p>
  `

  return wrapEmailTemplate("New Cost Added", content, unsubscribeUrl)
}

export function generateCostAddedText(data: CostEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=costs&costId=${data.costId}`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  return `
NEW COST ADDED - Real Estate Portfolio

Hi there,

${data.userName} added a new cost to ${data.projectName}:

Amount: ${formatCurrency(data.amount)}
Description: ${data.costDescription}

View Cost Details: ${projectUrl}

Click the link above to view the cost in your project dashboard.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}

/**
 * Large Expense Email (Critical Alert)
 */
export function generateLargeExpenseHTML(data: LargeExpenseEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=costs&costId=${data.costId}`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const content = `
    <p>Hi there,</p>
    <p><strong>🚨 LARGE EXPENSE ALERT</strong></p>
    <p><strong>${data.userName}</strong> added a significant expense to <strong>${data.projectName}</strong>:</p>
    <div class="large-expense">
      <p class="amount">${formatCurrency(data.amount)}</p>
      <p><strong>${data.costDescription}</strong></p>
    </div>
    <p>
      <a href="${projectUrl}" class="button">Review Expense Immediately</a>
    </p>
    <p>This expense exceeds the $10,000 threshold and requires your attention.</p>
  `

  return wrapEmailTemplate("🚨 Large Expense Alert", content, unsubscribeUrl)
}

export function generateLargeExpenseText(data: LargeExpenseEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=costs&costId=${data.costId}`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  return `
🚨 LARGE EXPENSE ALERT - Real Estate Portfolio

Hi there,

LARGE EXPENSE ALERT

${data.userName} added a significant expense to ${data.projectName}:

Amount: ${formatCurrency(data.amount)}
Description: ${data.costDescription}

Review Expense Immediately: ${projectUrl}

This expense exceeds the $10,000 threshold and requires your attention.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}

/**
 * Document Uploaded Email
 */
export function generateDocumentUploadedHTML(data: DocumentEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=documents`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const content = `
    <p>Hi there,</p>
    <p><strong>${data.userName}</strong> uploaded a new document to <strong>${data.projectName}</strong>:</p>
    <div class="highlight">
      <p><strong>📄 ${data.fileName}</strong></p>
    </div>
    <p>
      <a href="${projectUrl}" class="button">View Document</a>
    </p>
    <p>Click the button above to view the document in your project dashboard.</p>
  `

  return wrapEmailTemplate("New Document Uploaded", content, unsubscribeUrl)
}

export function generateDocumentUploadedText(data: DocumentEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=documents`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  return `
NEW DOCUMENT UPLOADED - Real Estate Portfolio

Hi there,

${data.userName} uploaded a new document to ${data.projectName}:

Document: ${data.fileName}

View Document: ${projectUrl}

Click the link above to view the document in your project dashboard.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}

/**
 * Timeline Event Email
 */
export function generateTimelineEventHTML(data: TimelineEventEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=timeline`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const content = `
    <p>Hi there,</p>
    <p><strong>${data.userName}</strong> created a new timeline event for <strong>${data.projectName}</strong>:</p>
    <div class="highlight">
      <p><strong>📅 ${data.eventTitle}</strong></p>
      <p>Date: ${formatDate(data.eventDate)}</p>
    </div>
    <p>
      <a href="${projectUrl}" class="button">View Timeline</a>
    </p>
    <p>Click the button above to view the event in your project timeline.</p>
  `

  return wrapEmailTemplate("New Timeline Event", content, unsubscribeUrl)
}

export function generateTimelineEventText(data: TimelineEventEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}?tab=timeline`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  return `
NEW TIMELINE EVENT - Real Estate Portfolio

Hi there,

${data.userName} created a new timeline event for ${data.projectName}:

Event: ${data.eventTitle}
Date: ${formatDate(data.eventDate)}

View Timeline: ${projectUrl}

Click the link above to view the event in your project timeline.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}

/**
 * Comment Added Email
 */
export function generateCommentAddedHTML(data: CommentEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const content = `
    <p>Hi there,</p>
    <p><strong>${data.userName}</strong> commented on <strong>${data.entityName}</strong> in <strong>${data.projectName}</strong>:</p>
    <div class="highlight">
      <p><em>"${data.commentPreview}"</em></p>
    </div>
    <p>
      <a href="${projectUrl}" class="button">View Comment</a>
    </p>
    <p>Click the button above to view the full comment and reply.</p>
  `

  return wrapEmailTemplate("New Comment", content, unsubscribeUrl)
}

export function generateCommentAddedText(data: CommentEmailData): string {
  const projectUrl = `${APP_URL}/projects/${data.projectId}`
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  return `
NEW COMMENT - Real Estate Portfolio

Hi there,

${data.userName} commented on ${data.entityName} in ${data.projectName}:

"${data.commentPreview}"

View Comment: ${projectUrl}

Click the link above to view the full comment and reply.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}

/**
 * Daily Digest Email
 */
export function generateDailyDigestHTML(data: DailyDigestEmailData): string {
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const totalNotifications = data.projects.reduce(
    (sum, project) => sum + project.notifications.length,
    0
  )

  const projectSections = data.projects
    .map((project) => {
      const projectUrl = `${APP_URL}/projects/${project.projectId}`
      const notificationList = project.notifications
        .map(
          (notif) => `
        <li style="margin-bottom: 8px;">
          <strong>${notif.type}:</strong> ${notif.message}
          <br />
          <small style="color: #6b7280;">${formatDate(notif.createdAt)}</small>
        </li>
      `
        )
        .join("")

      return `
      <div style="margin-bottom: 32px;">
        <h3 style="color: #667eea; margin-bottom: 16px;">${project.projectName}</h3>
        <ul style="list-style: none; padding: 0;">
          ${notificationList}
        </ul>
        <p>
          <a href="${projectUrl}" class="button">View Project</a>
        </p>
      </div>
    `
    })
    .join("")

  const content = `
    <p>Hi ${data.userName},</p>
    <p>Here's your daily summary of project activities from <strong>${formatDate(data.date)}</strong>:</p>
    <div class="highlight">
      <p><strong>${totalNotifications} notifications</strong> from <strong>${data.projects.length} project(s)</strong></p>
    </div>
    ${projectSections}
    <p>Stay informed about your projects with daily digests.</p>
  `

  return wrapEmailTemplate("Daily Project Digest", content, unsubscribeUrl)
}

export function generateDailyDigestText(data: DailyDigestEmailData): string {
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const totalNotifications = data.projects.reduce(
    (sum, project) => sum + project.notifications.length,
    0
  )

  const projectSections = data.projects
    .map((project) => {
      const projectUrl = `${APP_URL}/projects/${project.projectId}`
      const notificationList = project.notifications
        .map((notif) => `  - ${notif.type}: ${notif.message} (${formatDate(notif.createdAt)})`)
        .join("\n")

      return `
${project.projectName}
${notificationList}
View Project: ${projectUrl}
    `
    })
    .join("\n")

  return `
DAILY PROJECT DIGEST - Real Estate Portfolio

Hi ${data.userName},

Here's your daily summary of project activities from ${formatDate(data.date)}:

Summary: ${totalNotifications} notifications from ${data.projects.length} project(s)

${projectSections}

Stay informed about your projects with daily digests.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}

/**
 * Weekly Digest Email
 */
export function generateWeeklyDigestHTML(data: WeeklyDigestEmailData): string {
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const totalNotifications = data.projects.reduce(
    (sum, project) => sum + project.notifications.length,
    0
  )

  const projectSections = data.projects
    .map((project) => {
      const projectUrl = `${APP_URL}/projects/${project.projectId}`
      const notificationList = project.notifications
        .map(
          (notif) => `
        <li style="margin-bottom: 8px;">
          <strong>${notif.type}:</strong> ${notif.message}
          <br />
          <small style="color: #6b7280;">${formatDate(notif.createdAt)}</small>
        </li>
      `
        )
        .join("")

      return `
      <div style="margin-bottom: 32px;">
        <h3 style="color: #667eea; margin-bottom: 16px;">${project.projectName}</h3>
        <ul style="list-style: none; padding: 0;">
          ${notificationList}
        </ul>
        <p>
          <a href="${projectUrl}" class="button">View Project</a>
        </p>
      </div>
    `
    })
    .join("")

  const content = `
    <p>Hi ${data.userName},</p>
    <p>Here's your weekly summary of project activities from <strong>${formatDate(data.weekStart)}</strong> to <strong>${formatDate(data.weekEnd)}</strong>:</p>
    <div class="highlight">
      <p><strong>${totalNotifications} notifications</strong> from <strong>${data.projects.length} project(s)</strong></p>
    </div>
    ${projectSections}
    <p>Stay informed about your projects with weekly digests.</p>
  `

  return wrapEmailTemplate("Weekly Project Digest", content, unsubscribeUrl)
}

export function generateWeeklyDigestText(data: WeeklyDigestEmailData): string {
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${data.unsubscribeToken}`

  const totalNotifications = data.projects.reduce(
    (sum, project) => sum + project.notifications.length,
    0
  )

  const projectSections = data.projects
    .map((project) => {
      const projectUrl = `${APP_URL}/projects/${project.projectId}`
      const notificationList = project.notifications
        .map((notif) => `  - ${notif.type}: ${notif.message} (${formatDate(notif.createdAt)})`)
        .join("\n")

      return `
${project.projectName}
${notificationList}
View Project: ${projectUrl}
    `
    })
    .join("\n")

  return `
WEEKLY PROJECT DIGEST - Real Estate Portfolio

Hi ${data.userName},

Here's your weekly summary of project activities from ${formatDate(data.weekStart)} to ${formatDate(data.weekEnd)}:

Summary: ${totalNotifications} notifications from ${data.projects.length} project(s)

${projectSections}

Stay informed about your projects with weekly digests.

---
This email was sent from Real Estate Portfolio
You received this email because you are a member of this project.
Unsubscribe: ${unsubscribeUrl}
  `.trim()
}
