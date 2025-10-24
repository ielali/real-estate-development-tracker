import { Resend } from "resend"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface PasswordResetEmailData {
  user: {
    email: string
    name: string
  }
  resetUrl: string
  token: string
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

  async sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    if (this.isDevelopment) {
      // Development: Log email to console
      console.log("\n" + "=".repeat(60))
      console.log("📧 EMAIL SENT (Development Mode)")
      console.log("=".repeat(60))
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log("\nHTML Content:")
      console.log(html)
      if (text) {
        console.log("\nText Content:")
        console.log(text)
      }
      console.log("=".repeat(60) + "\n")
      return
    }

    // Production: Send via Resend
    try {
      const resend = this.getResendClient()
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        ...(text && { text }),
      })

      console.log("✅ Email sent successfully via Resend:", result)
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
  }: PasswordResetEmailData): Promise<void> {
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

    await this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
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
}

export const emailService = new EmailService()
