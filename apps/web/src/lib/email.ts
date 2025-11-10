import { Resend } from "resend"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  tags?: Record<string, string>
}

interface PasswordResetEmailData {
  user: {
    email: string
    name: string
  }
  resetUrl: string
  token: string
}

interface InvitationEmailData {
  email: string
  projectName: string
  inviterName: string
  inviterEmail: string
  permission: "read" | "write"
  invitationToken: string
  expiresAt: Date
}

/**
 * QA Fix (SEC-004): Email notification data for 2FA state changes
 */
interface TwoFactorEmailData {
  user: {
    email: string
    name: string
  }
  action: "enabled" | "disabled" | "backup-codes-regenerated"
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export class EmailService {
  private isDevelopment = process.env.NODE_ENV === "development"
  private resend: Resend | null = null

  private getResendClient(): Resend {
    if (!this.resend) {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set")
      }
      this.resend = new Resend(apiKey)
    }
    return this.resend
  }

  /**
   * Sanitize tag values for Resend API
   * Resend requires tag values to only contain ASCII letters, numbers, underscores, or dashes
   */
  private sanitizeTagValue(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9_-]/g, "_") // Replace invalid chars with underscore
      .replace(/_+/g, "_") // Collapse multiple underscores
      .replace(/^_|_$/g, "") // Trim leading/trailing underscores
      .slice(0, 256) // Limit length
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Send email with retry logic and exponential backoff
   * Story 8.2: QA Fix - Implement email retry mechanism
   *
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000ms)
   */
  async sendEmailWithRetry(
    options: SendEmailOptions,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<{ resendId: string | null; attempts: number; error?: string }> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resendId = await this.sendEmail(options)
        return { resendId, attempts: attempt }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")
        console.warn(`Email send attempt ${attempt}/${maxRetries} failed:`, lastError.message)

        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    // All retries exhausted
    const errorMessage = lastError?.message || "Unknown error after all retries"
    console.error(`❌ Email failed after ${maxRetries} attempts:`, errorMessage)
    return {
      resendId: null,
      attempts: maxRetries,
      error: errorMessage,
    }
  }

  async sendEmail({ to, subject, html, text, tags }: SendEmailOptions): Promise<string | null> {
    if (this.isDevelopment) {
      // Development: Log email to console
      console.log("\n" + "=".repeat(60))
      console.log("📧 EMAIL SENT (Development Mode)")
      console.log("=".repeat(60))
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      if (tags) {
        console.log(`Tags: ${JSON.stringify(tags)}`)
      }
      console.log("\nHTML Content:")
      console.log(html)
      if (text) {
        console.log("\nText Content:")
        console.log(text)
      }
      console.log("=".repeat(60) + "\n")
      return null // No Resend ID in development
    }

    // Production: Send via Resend
    try {
      const resend = this.getResendClient()
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

      // Convert tags from Record<string, string> to Tag[] format
      // Sanitize tag values to meet Resend's requirements (ASCII letters, numbers, underscores, dashes only)
      const tagsArray = tags
        ? Object.entries(tags).map(([name, value]) => ({
            name,
            value: this.sanitizeTagValue(value),
          }))
        : undefined

      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        ...(text && { text }),
        ...(tagsArray && { tags: tagsArray }),
      })

      console.log("✅ Email sent successfully via Resend:", result)
      return result.data?.id || null
    } catch (error) {
      console.error("❌ Failed to send email via Resend:", error)
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  async sendPasswordResetEmail({
    user,
    resetUrl,
    token: _token,
  }: PasswordResetEmailData): Promise<string | null> {
    const subject = "Reset Your Password - Real Estate Portfolio"

    const html = this.generatePasswordResetHTML({
      name: user.name || user.email,
      resetUrl,
      expirationTime: "1 hour",
    })

    const text = this.generatePasswordResetText({
      name: user.name || user.email,
      resetUrl,
      expirationTime: "1 hour",
    })

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
      tags: {
        type: "password-reset",
        userId: user.email,
      },
    })
  }

  async sendInvitationEmail(data: InvitationEmailData): Promise<string | null> {
    const subject = `You've been invited to ${data.projectName} - Real Estate Portfolio`

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${data.invitationToken}`

    const html = this.generateInvitationHTML({
      projectName: data.projectName,
      inviterName: data.inviterName,
      inviterEmail: data.inviterEmail,
      permission: data.permission,
      invitationUrl,
      expiresAt: data.expiresAt,
    })

    const text = this.generateInvitationText({
      projectName: data.projectName,
      inviterName: data.inviterName,
      inviterEmail: data.inviterEmail,
      permission: data.permission,
      invitationUrl,
      expiresAt: data.expiresAt,
    })

    return await this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
      tags: {
        type: "project-invitation",
        projectName: data.projectName,
        permission: data.permission,
      },
    })
  }

  /**
   * QA Fix (SEC-004): Send email notification for 2FA state changes
   */
  async send2FANotification(data: TwoFactorEmailData): Promise<string | null> {
    const actionText = {
      enabled: "Two-Factor Authentication Enabled",
      disabled: "Two-Factor Authentication Disabled",
      "backup-codes-regenerated": "Backup Codes Regenerated",
    }[data.action]

    const subject = `${actionText} - Real Estate Portfolio`

    const html = this.generate2FANotificationHTML(data)
    const text = this.generate2FANotificationText(data)

    return await this.sendEmail({
      to: data.user.email,
      subject,
      html,
      text,
      tags: {
        type: "2fa-notification",
        action: data.action,
        userId: data.user.email,
      },
    })
  }

  private generatePasswordResetHTML({
    name,
    resetUrl,
    expirationTime,
  }: {
    name: string
    resetUrl: string
    expirationTime: string
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
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
        .content {
            padding: 32px 24px;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
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
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .warning-text {
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Real Estate Portfolio</p>
        </div>

        <div class="content">
            <p>Hi ${name},</p>

            <p>We received a request to reset your password for your Real Estate Portfolio account. If you didn't make this request, you can safely ignore this email.</p>

            <p>To reset your password, click the button below:</p>

            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 4px;">
                ${resetUrl}
            </p>

            <div class="warning">
                <p class="warning-text">
                    <strong>Security Notice:</strong> This link will expire in ${expirationTime}.
                    If you didn't request this password reset, please contact support immediately.
                </p>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent from Real Estate Portfolio</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  private generatePasswordResetText({
    name,
    resetUrl,
    expirationTime,
  }: {
    name: string
    resetUrl: string
    expirationTime: string
  }): string {
    return `
Hi ${name},

We received a request to reset your password for your Real Estate Portfolio account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

SECURITY NOTICE: This link will expire in ${expirationTime}. If you didn't request this password reset, please contact support immediately.

This email was sent from Real Estate Portfolio.
If you have any questions, please contact our support team.
    `.trim()
  }

  private generateInvitationHTML({
    projectName,
    inviterName,
    inviterEmail,
    permission,
    invitationUrl,
    expiresAt,
  }: {
    projectName: string
    inviterName: string
    inviterEmail: string
    permission: "read" | "write"
    invitationUrl: string
    expiresAt: Date
  }): string {
    const permissionLabel = permission === "read" ? "READ" : "WRITE"
    const permissionDescription =
      permission === "read"
        ? "You can view all project updates, costs, and documents."
        : "You can view and edit project information, add costs, and upload documents."

    const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const expirationText = expiresIn === 1 ? "tomorrow" : `in ${expiresIn} days`

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited to ${projectName}</title>
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
        .content {
            padding: 32px 24px;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
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
        .info-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .info-text {
            color: #1e40af;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">You've Been Invited!</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Real Estate Portfolio</p>
        </div>

        <div class="content">
            <p>Hi!</p>

            <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectName}</strong>.</p>

            <div class="info-box">
                <p class="info-text">
                    <strong>Your Access Level:</strong> <span class="badge">${permissionLabel}</span><br><br>
                    ${permissionDescription}
                </p>
            </div>

            <p>Accept this invitation to get started with the project dashboard:</p>

            <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>

            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 4px;">
                ${invitationUrl}
            </p>

            <p style="color: #6b7280; font-size: 14px;">
                <strong>Important:</strong> This invitation expires ${expirationText}.
                If you have questions, contact ${inviterName} at ${inviterEmail}.
            </p>
        </div>

        <div class="footer">
            <p>This email was sent from Real Estate Portfolio</p>
            <p>You received this email because ${inviterName} invited you to collaborate on a project.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  private generateInvitationText({
    projectName,
    inviterName,
    inviterEmail,
    permission,
    invitationUrl,
    expiresAt,
  }: {
    projectName: string
    inviterName: string
    inviterEmail: string
    permission: "read" | "write"
    invitationUrl: string
    expiresAt: Date
  }): string {
    const permissionLabel = permission === "read" ? "READ" : "WRITE"
    const permissionDescription =
      permission === "read"
        ? "You can view all project updates, costs, and documents."
        : "You can view and edit project information, add costs, and upload documents."

    const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const expirationText = expiresIn === 1 ? "tomorrow" : `in ${expiresIn} days`

    return `
Hi!

${inviterName} has invited you to collaborate on ${projectName}.

YOUR ACCESS LEVEL: ${permissionLabel}
${permissionDescription}

Accept this invitation to get started with the project dashboard:
${invitationUrl}

IMPORTANT: This invitation expires ${expirationText}.
If you have questions, contact ${inviterName} at ${inviterEmail}.

This email was sent from Real Estate Portfolio.
You received this email because ${inviterName} invited you to collaborate on a project.
    `.trim()
  }

  /**
   * QA Fix (SEC-004): Generate HTML email for 2FA state change notifications
   */
  private generate2FANotificationHTML(data: TwoFactorEmailData): string {
    const actionDetails = {
      enabled: {
        title: "Two-Factor Authentication Enabled",
        description: "Two-factor authentication has been enabled on your account.",
        icon: "🔒",
        color: "#10b981",
      },
      disabled: {
        title: "Two-Factor Authentication Disabled",
        description: "Two-factor authentication has been disabled on your account.",
        icon: "🔓",
        color: "#f59e0b",
      },
      "backup-codes-regenerated": {
        title: "Backup Codes Regenerated",
        description:
          "New backup codes have been generated for your account. Your old codes are no longer valid.",
        icon: "🔑",
        color: "#3b82f6",
      },
    }[data.action]

    const timestamp = data.timestamp.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${actionDetails.title}</title>
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
            background: ${actionDetails.color};
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        .content {
            padding: 32px 24px;
        }
        .footer {
            background: #f3f4f6;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .info-box {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .info-text {
            color: #4b5563;
            font-size: 14px;
            margin: 4px 0;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .warning-text {
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">${actionDetails.icon} ${actionDetails.title}</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Real Estate Portfolio</p>
        </div>

        <div class="content">
            <p>Hi ${data.user.name},</p>

            <p>${actionDetails.description}</p>

            <div class="info-box">
                <p class="info-text"><strong>When:</strong> ${timestamp}</p>
                ${data.ipAddress ? `<p class="info-text"><strong>IP Address:</strong> ${data.ipAddress}</p>` : ""}
                ${data.userAgent ? `<p class="info-text"><strong>Device:</strong> ${data.userAgent}</p>` : ""}
            </div>

            ${
              data.action === "disabled"
                ? `
            <div class="warning">
                <p class="warning-text">
                    <strong>Security Notice:</strong> If you did not make this change, please contact support immediately and reset your password.
                </p>
            </div>
            `
                : ""
            }

            ${
              data.action === "backup-codes-regenerated"
                ? `
            <p style="color: #6b7280; font-size: 14px;">
                <strong>Important:</strong> Your previous backup codes are no longer valid. Make sure to save your new codes in a secure location.
            </p>
            `
                : ""
            }

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                If you did not make this change, please secure your account immediately:
            </p>
            <ol style="color: #6b7280; font-size: 14px; margin-top: 8px;">
                <li>Change your password</li>
                <li>Review your account settings</li>
                <li>Contact our support team</li>
            </ol>
        </div>

        <div class="footer">
            <p>This email was sent from Real Estate Portfolio</p>
            <p>This is an automated security notification for your account.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * QA Fix (SEC-004): Generate plain text email for 2FA state change notifications
   */
  private generate2FANotificationText(data: TwoFactorEmailData): string {
    const actionDetails = {
      enabled: {
        title: "Two-Factor Authentication Enabled",
        description: "Two-factor authentication has been enabled on your account.",
      },
      disabled: {
        title: "Two-Factor Authentication Disabled",
        description: "Two-factor authentication has been disabled on your account.",
      },
      "backup-codes-regenerated": {
        title: "Backup Codes Regenerated",
        description:
          "New backup codes have been generated for your account. Your old codes are no longer valid.",
      },
    }[data.action]

    const timestamp = data.timestamp.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })

    let text = `
Hi ${data.user.name},

${actionDetails.description}

WHEN: ${timestamp}
${data.ipAddress ? `IP ADDRESS: ${data.ipAddress}` : ""}
${data.userAgent ? `DEVICE: ${data.userAgent}` : ""}
`

    if (data.action === "disabled") {
      text += `
SECURITY NOTICE: If you did not make this change, please contact support immediately and reset your password.
`
    }

    if (data.action === "backup-codes-regenerated") {
      text += `
IMPORTANT: Your previous backup codes are no longer valid. Make sure to save your new codes in a secure location.
`
    }

    text += `
If you did not make this change, please secure your account immediately:
1. Change your password
2. Review your account settings
3. Contact our support team

This email was sent from Real Estate Portfolio.
This is an automated security notification for your account.
    `.trim()

    return text
  }

  /**
   * Story 6.3: Send email notification when backup code is used
   */
  async sendBackupCodeUsedEmail(
    user: { email: string; name: string },
    timestamp: Date,
    device: string,
    ipAddress: string
  ): Promise<string | null> {
    const subject = "Security Alert: Backup Code Used - Real Estate Portfolio"

    const html = this.generateBackupCodeUsedHTML(user, timestamp, device, ipAddress)
    const text = this.generateBackupCodeUsedText(user, timestamp, device, ipAddress)

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
      tags: {
        type: "security-alert",
        event: "backup-code-used",
        userId: user.email,
      },
    })
  }

  /**
   * Story 6.3: Send email notification when project backup is downloaded
   */
  async sendBackupDownloadedEmail(
    user: { email: string; name: string },
    projectName: string,
    timestamp: Date,
    device: string,
    ipAddress: string
  ): Promise<string | null> {
    const subject = "Project Backup Downloaded - Real Estate Portfolio"

    const html = this.generateBackupDownloadedHTML(user, projectName, timestamp, device, ipAddress)
    const text = this.generateBackupDownloadedText(user, projectName, timestamp, device, ipAddress)

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
      tags: {
        type: "security-alert",
        event: "backup-downloaded",
        projectName,
        userId: user.email,
      },
    })
  }

  /**
   * Story 6.3: Generate HTML email for backup code used alert
   */
  private generateBackupCodeUsedHTML(
    user: { email: string; name: string },
    timestamp: Date,
    device: string,
    ipAddress: string
  ): string {
    const formattedTimestamp = timestamp.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })

    // Partially mask IP address for privacy (e.g., "203.0.113.xxx")
    const maskedIP = ipAddress.split(".").slice(0, 3).join(".") + ".xxx"

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert: Backup Code Used</title>
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
            background: #dc2626;
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        .content {
            padding: 32px 24px;
        }
        .footer {
            background: #f3f4f6;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .info-box {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .info-text {
            color: #4b5563;
            font-size: 14px;
            margin: 4px 0;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .warning-text {
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🚨 Security Alert: Backup Code Used</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Real Estate Portfolio</p>
        </div>

        <div class="content">
            <p>Hi ${user.name},</p>

            <p>A backup code was used to sign in to your account. This is an important security event.</p>

            <div class="info-box">
                <p class="info-text"><strong>When:</strong> ${formattedTimestamp}</p>
                <p class="info-text"><strong>Device:</strong> ${device}</p>
                <p class="info-text"><strong>IP Address:</strong> ${maskedIP}</p>
            </div>

            <div class="warning">
                <p class="warning-text">
                    <strong>Security Notice:</strong> Backup codes should only be used when you don't have access to your authenticator app. If this wasn't you, contact support immediately and secure your account.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                <strong>Remember:</strong> Each backup code can only be used once. Generate new codes if you're running low.
            </p>
        </div>

        <div class="footer">
            <p>This email was sent from Real Estate Portfolio</p>
            <p>This is an automated security notification for your account.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Story 6.3: Generate plain text email for backup code used alert
   */
  private generateBackupCodeUsedText(
    user: { email: string; name: string },
    timestamp: Date,
    device: string,
    ipAddress: string
  ): string {
    const formattedTimestamp = timestamp.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })

    const maskedIP = ipAddress.split(".").slice(0, 3).join(".") + ".xxx"

    return `
Hi ${user.name},

A backup code was used to sign in to your account. This is an important security event.

WHEN: ${formattedTimestamp}
DEVICE: ${device}
IP ADDRESS: ${maskedIP}

SECURITY NOTICE: Backup codes should only be used when you don't have access to your authenticator app. If this wasn't you, contact support immediately and secure your account.

REMEMBER: Each backup code can only be used once. Generate new codes if you're running low.

This email was sent from Real Estate Portfolio.
This is an automated security notification for your account.
    `.trim()
  }

  /**
   * Story 6.3: Generate HTML email for project backup downloaded notification
   */
  private generateBackupDownloadedHTML(
    user: { email: string; name: string },
    projectName: string,
    timestamp: Date,
    device: string,
    ipAddress: string
  ): string {
    const formattedTimestamp = timestamp.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })

    const maskedIP = ipAddress.split(".").slice(0, 3).join(".") + ".xxx"

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Backup Downloaded</title>
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
            background: #3b82f6;
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        .content {
            padding: 32px 24px;
        }
        .footer {
            background: #f3f4f6;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .info-box {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .info-text {
            color: #4b5563;
            font-size: 14px;
            margin: 4px 0;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .warning-text {
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">💾 Project Backup Downloaded</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Real Estate Portfolio</p>
        </div>

        <div class="content">
            <p>Hi ${user.name},</p>

            <p>A backup of your project <strong>${projectName}</strong> was downloaded from your account.</p>

            <div class="info-box">
                <p class="info-text"><strong>When:</strong> ${formattedTimestamp}</p>
                <p class="info-text"><strong>Project:</strong> ${projectName}</p>
                <p class="info-text"><strong>Device:</strong> ${device}</p>
                <p class="info-text"><strong>IP Address:</strong> ${maskedIP}</p>
            </div>

            <div class="warning">
                <p class="warning-text">
                    <strong>Security Notice:</strong> If you didn't download this backup, please contact support immediately. Unauthorized access to project backups could indicate a security issue.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                Project backups contain sensitive information including costs, contacts, and documents. Please store them securely.
            </p>
        </div>

        <div class="footer">
            <p>This email was sent from Real Estate Portfolio</p>
            <p>This is an automated security notification for your account.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Story 6.3: Generate plain text email for project backup downloaded notification
   */
  private generateBackupDownloadedText(
    user: { email: string; name: string },
    projectName: string,
    timestamp: Date,
    device: string,
    ipAddress: string
  ): string {
    const formattedTimestamp = timestamp.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })

    const maskedIP = ipAddress.split(".").slice(0, 3).join(".") + ".xxx"

    return `
Hi ${user.name},

A backup of your project "${projectName}" was downloaded from your account.

WHEN: ${formattedTimestamp}
PROJECT: ${projectName}
DEVICE: ${device}
IP ADDRESS: ${maskedIP}

SECURITY NOTICE: If you didn't download this backup, please contact support immediately. Unauthorized access to project backups could indicate a security issue.

Project backups contain sensitive information including costs, contacts, and documents. Please store them securely.

This email was sent from Real Estate Portfolio.
This is an automated security notification for your account.
    `.trim()
  }

  /**
   * Story 8.2: Notification Email Methods
   */

  async sendCostAddedEmail(
    data: import("./notification-email-templates").CostEmailData
  ): Promise<string | null> {
    const { generateCostAddedHTML, generateCostAddedText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Cost Added to ${data.projectName} - Real Estate Portfolio`
    const html = generateCostAddedHTML(data)
    const text = generateCostAddedText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "cost-added",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendLargeExpenseEmail(
    data: import("./notification-email-templates").LargeExpenseEmailData
  ): Promise<string | null> {
    const { generateLargeExpenseHTML, generateLargeExpenseText } = await import(
      "./notification-email-templates"
    )

    const subject = `🚨 Large Expense Alert: ${data.projectName} - Real Estate Portfolio`
    const html = generateLargeExpenseHTML(data)
    const text = generateLargeExpenseText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "large-expense",
        priority: "critical",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendDocumentUploadedEmail(
    data: import("./notification-email-templates").DocumentEmailData
  ): Promise<string | null> {
    const { generateDocumentUploadedHTML, generateDocumentUploadedText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Document Uploaded to ${data.projectName} - Real Estate Portfolio`
    const html = generateDocumentUploadedHTML(data)
    const text = generateDocumentUploadedText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "document-uploaded",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendTimelineEventEmail(
    data: import("./notification-email-templates").TimelineEventEmailData
  ): Promise<string | null> {
    const { generateTimelineEventHTML, generateTimelineEventText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Timeline Event: ${data.projectName} - Real Estate Portfolio`
    const html = generateTimelineEventHTML(data)
    const text = generateTimelineEventText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "timeline-event",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendCommentAddedEmail(
    data: import("./notification-email-templates").CommentEmailData
  ): Promise<string | null> {
    const { generateCommentAddedHTML, generateCommentAddedText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Comment on ${data.projectName} - Real Estate Portfolio`
    const html = generateCommentAddedHTML(data)
    const text = generateCommentAddedText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "comment-added",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendDailyDigestEmail(
    data: import("./notification-email-templates").DailyDigestEmailData
  ): Promise<string | null> {
    const { generateDailyDigestHTML, generateDailyDigestText } = await import(
      "./notification-email-templates"
    )

    const subject = `Daily Project Digest - Real Estate Portfolio`
    const html = generateDailyDigestHTML(data)
    const text = generateDailyDigestText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "digest",
        digestType: "daily",
        date: data.date.toISOString().split("T")[0],
      },
    })
  }

  async sendWeeklyDigestEmail(
    data: import("./notification-email-templates").WeeklyDigestEmailData
  ): Promise<string | null> {
    const { generateWeeklyDigestHTML, generateWeeklyDigestText } = await import(
      "./notification-email-templates"
    )

    const subject = `Weekly Project Digest - Real Estate Portfolio`
    const html = generateWeeklyDigestHTML(data)
    const text = generateWeeklyDigestText(data)

    return await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "digest",
        digestType: "weekly",
        weekStart: data.weekStart.toISOString().split("T")[0],
      },
    })
  }

  /**
   * Email retry wrapper methods
   * Story 8.2: QA Fix - Implement email retry for notification emails
   */

  async sendCostAddedEmailWithRetry(
    data: import("./notification-email-templates").CostEmailData
  ): Promise<{ resendId: string | null; attempts: number; error?: string }> {
    const { generateCostAddedHTML, generateCostAddedText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Cost Added to ${data.projectName} - Real Estate Portfolio`
    const html = generateCostAddedHTML(data)
    const text = generateCostAddedText(data)

    return await this.sendEmailWithRetry({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "cost-added",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendLargeExpenseEmailWithRetry(
    data: import("./notification-email-templates").LargeExpenseEmailData
  ): Promise<{ resendId: string | null; attempts: number; error?: string }> {
    const { generateLargeExpenseHTML, generateLargeExpenseText } = await import(
      "./notification-email-templates"
    )

    const subject = `🚨 Large Expense Alert: ${data.projectName} - Real Estate Portfolio`
    const html = generateLargeExpenseHTML(data)
    const text = generateLargeExpenseText(data)

    return await this.sendEmailWithRetry({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "large-expense",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendDocumentUploadedEmailWithRetry(
    data: import("./notification-email-templates").DocumentEmailData
  ): Promise<{ resendId: string | null; attempts: number; error?: string }> {
    const { generateDocumentUploadedHTML, generateDocumentUploadedText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Document Uploaded to ${data.projectName} - Real Estate Portfolio`
    const html = generateDocumentUploadedHTML(data)
    const text = generateDocumentUploadedText(data)

    return await this.sendEmailWithRetry({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "document-uploaded",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendTimelineEventEmailWithRetry(
    data: import("./notification-email-templates").TimelineEventEmailData
  ): Promise<{ resendId: string | null; attempts: number; error?: string }> {
    const { generateTimelineEventHTML, generateTimelineEventText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Timeline Event: ${data.projectName} - Real Estate Portfolio`
    const html = generateTimelineEventHTML(data)
    const text = generateTimelineEventText(data)

    return await this.sendEmailWithRetry({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "timeline-event",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }

  async sendCommentAddedEmailWithRetry(
    data: import("./notification-email-templates").CommentEmailData
  ): Promise<{ resendId: string | null; attempts: number; error?: string }> {
    const { generateCommentAddedHTML, generateCommentAddedText } = await import(
      "./notification-email-templates"
    )

    const subject = `New Comment on ${data.projectName} - Real Estate Portfolio`
    const html = generateCommentAddedHTML(data)
    const text = generateCommentAddedText(data)

    return await this.sendEmailWithRetry({
      to: data.recipientEmail,
      subject,
      html,
      text,
      tags: {
        type: "notification",
        notificationType: "comment-added",
        projectId: data.projectId,
        projectName: data.projectName,
      },
    })
  }
}

export const emailService = new EmailService()
