import { ENV } from "./_core/env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email notification
 * In production, integrate with SendGrid, Mailgun, or similar service
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For MVP, log to console
    // In production, replace with actual email service
    console.log(`[EMAIL] To: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] Body: ${options.html}`);

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: options.to }] }],
    //     from: { email: "noreply@approval.service" },
    //     subject: options.subject,
    //     content: [{ type: "text/html", value: options.html }],
    //   }),
    // });
    // return response.ok;

    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    return false;
  }
}

/**
 * Send approval link email to client
 */
export async function sendApprovalLinkEmail(
  clientEmail: string,
  clientName: string,
  approvalLink: string,
  dealTotal: string
): Promise<boolean> {
  const html = `
    <h2>Deal Approval Required</h2>
    <p>Hi ${escapeHtml(clientName)},</p>
    <p>A new deal worth ${escapeHtml(dealTotal)} is awaiting your approval.</p>
    <p>
      <a href="${escapeHtml(approvalLink)}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
        Review & Approve Deal
      </a>
    </p>
    <p>This link will expire in 14 days.</p>
    <p>Best regards,<br>Approval Service</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Deal Approval Required - ${dealTotal}`,
    html,
  });
}

/**
 * Send approval confirmation email to deal owner
 */
export async function sendApprovalConfirmedEmail(
  ownerEmail: string,
  clientName: string,
  dealTotal: string,
  approvalTime: string
): Promise<boolean> {
  const html = `
    <h2>Deal Approved</h2>
    <p>The following deal has been approved:</p>
    <ul>
      <li><strong>Client:</strong> ${escapeHtml(clientName)}</li>
      <li><strong>Amount:</strong> ${escapeHtml(dealTotal)}</li>
      <li><strong>Approved at:</strong> ${escapeHtml(approvalTime)}</li>
    </ul>
    <p>You can now proceed with invoicing.</p>
    <p>Best regards,<br>Approval Service</p>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `Deal Approved - ${clientName}`,
    html,
  });
}

/**
 * Send rejection notification email to deal owner
 */
export async function sendApprovalRejectedEmail(
  ownerEmail: string,
  clientName: string,
  dealTotal: string,
  rejectionTime: string
): Promise<boolean> {
  const html = `
    <h2>Deal Rejected</h2>
    <p>The following deal has been rejected:</p>
    <ul>
      <li><strong>Client:</strong> ${escapeHtml(clientName)}</li>
      <li><strong>Amount:</strong> ${escapeHtml(dealTotal)}</li>
      <li><strong>Rejected at:</strong> ${escapeHtml(rejectionTime)}</li>
    </ul>
    <p>Please contact the client for more information.</p>
    <p>Best regards,<br>Approval Service</p>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `Deal Rejected - ${clientName}`,
    html,
  });
}

/**
 * Escape HTML to prevent XSS in emails
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
