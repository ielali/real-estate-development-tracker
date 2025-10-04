/**
 * Resend email service integration
 *
 * Production-ready email service using Resend API
 */

import { Resend } from "resend"

// Initialize Resend client
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set")
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

/**
 * Send an email using Resend
 */
export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM_EMAIL,
}: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}) {
  const resend = getResendClient()

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(text && { text }),
    })

    return data
  } catch (error) {
    console.error("Failed to send email via Resend:", error)
    throw error
  }
}

/**
 * Send partner invitation email
 */
export async function sendPartnerInvitationEmail({
  to,
  projectName,
  inviterName,
  inviteUrl,
}: {
  to: string
  projectName: string
  inviterName: string
  inviteUrl: string
}) {
  const subject = `You've been invited to join ${projectName}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Project Invitation</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Real Estate Portfolio</p>
        </div>

        <div style="padding: 32px 24px;">
            <p>Hello,</p>

            <p><strong>${inviterName}</strong> has invited you to collaborate on the project <strong>${projectName}</strong> in Real Estate Portfolio.</p>

            <p>Click the button below to accept the invitation and get started:</p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Accept Invitation
                </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px;">
                ${inviteUrl}
            </p>
        </div>

        <div style="background: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">This email was sent from Real Estate Portfolio</p>
        </div>
    </div>
</body>
</html>
  `.trim()

  const text = `
Hello,

${inviterName} has invited you to collaborate on the project "${projectName}" in Real Estate Portfolio.

Click the link below to accept the invitation:
${inviteUrl}

This email was sent from Real Estate Portfolio.
  `.trim()

  return sendEmailViaResend({
    to,
    subject,
    html,
    text,
  })
}
