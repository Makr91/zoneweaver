import nodemailer from 'nodemailer';
import { log } from '../../utils/Logger.js';
import { getConfig, getAppConfig, createTransporter } from './transport.js';

/**
 * Send organization invitation email
 * @param {Object} invitation - Invitation model instance (loaded with the `withDetails` scope)
 * @param {string} invitation.email - Recipient email
 * @param {string} invitation.invite_code - Invitation code
 * @param {string} invitation.expires_at - Expiration date
 * @param {Object} [invitation.organization] - Associated organization (provides `.name`)
 * @param {Object} [invitation.invitedBy] - Associated inviter user (provides `.username`)
 * @returns {Promise<Object>} Email send result
 */
export const sendInvitationEmail = async invitation => {
  try {
    const organizationName = invitation.organization?.name || 'your organization';
    const inviterName = invitation.invitedBy?.username || 'An administrator';

    log.mail.info('Attempting to send invitation email', {
      recipient: invitation.email,
      organization: organizationName,
    });

    const mailConfig = getConfig();
    if (!mailConfig) {
      throw new Error('Mail configuration not available');
    }

    const transporter = createTransporter();

    const frontendUrl = getAppConfig()?.frontend_url || 'https://localhost:3001';

    const invitationLink = `${frontendUrl}/register?invite=${invitation.invite_code}`;
    const expirationDate = new Date(invitation.expires_at).toLocaleString();

    log.mail.debug('Preparing invitation email');

    const mailOptions = {
      from: mailConfig.smtp_from.value,
      to: invitation.email,
      subject: `Hyperweaver Organization Invitation - ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hyperweaver Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3273dc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #23d160; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background-color: #20bc56; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .org-info { background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited to Hyperweaver!</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p><strong>${inviterName}</strong> has invited you to join the <strong>${organizationName}</strong> organization on Hyperweaver.</p>

              <div class="org-info">
                <h3>📋 Organization Details</h3>
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Invited by:</strong> ${inviterName}</p>
                <p><strong>Invitation expires:</strong> ${expirationDate}</p>
              </div>

              <p>Hyperweaver is a powerful platform for managing virtual machines across your hypervisor hosts. By joining this organization, you'll have access to:</p>
              <ul>
                <li>🖥️ Machine management</li>
                <li>📊 System monitoring and analytics</li>
                <li>🔧 Infrastructure administration tools</li>
                <li>👥 Collaborative team management</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" class="button">Accept Invitation & Create Account</a>
              </div>

              <p><strong>What happens next?</strong></p>
              <ol>
                <li>Click the invitation link above</li>
                <li>Create your Hyperweaver account</li>
                <li>Start collaborating with your team!</li>
              </ol>

              <div class="footer">
                <p><strong>Security Note:</strong> This invitation is unique to your email address and will expire on ${expirationDate}. If you didn't expect this invitation, you can safely ignore this email.</p>
                <p>If you have any questions, please contact ${inviterName} or your system administrator.</p>
                <p>This email was sent by Hyperweaver. For more information, visit our documentation.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hyperweaver Organization Invitation

Hello!

${inviterName} has invited you to join the ${organizationName} organization on Hyperweaver.

Organization: ${organizationName}
Invited by: ${inviterName}
Invitation expires: ${expirationDate}

To accept this invitation and create your account, please visit:
${invitationLink}

Hyperweaver is a powerful platform for managing virtual machines across your hypervisor hosts. By joining this organization, you'll have access to machine management, system monitoring, infrastructure administration tools, and collaborative team management.

What happens next?
1. Click the invitation link above
2. Create your Hyperweaver account
3. Start collaborating with your team!

Security Note: This invitation is unique to your email address and will expire on ${expirationDate}. If you didn't expect this invitation, you can safely ignore this email.

If you have any questions, please contact ${inviterName} or your system administrator.
      `,
    };

    log.mail.info('Sending invitation email');
    const info = await transporter.sendMail(mailOptions);

    log.mail.info('Invitation email sent successfully', { messageId: info.messageId });
    if (nodemailer.getTestMessageUrl(info)) {
      log.mail.debug('Preview URL', { url: nodemailer.getTestMessageUrl(info) });
    }

    return {
      success: true,
      messageId: info.messageId,
      message: 'Invitation email sent successfully',
    };
  } catch (error) {
    log.mail.error('Error sending invitation email', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
      message: 'Failed to send invitation email',
    };
  }
};
