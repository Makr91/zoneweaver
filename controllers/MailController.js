import nodemailer from 'nodemailer';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';

/**
 * Mail controller for sending emails (invitations, notifications, etc.)
 */
class MailController {
  static config = null;
  static appConfig = null;

  /**
   * Initialize mail configuration
   */
  static init() {
    try {
      const fullConfig = loadConfig();

      this.config = fullConfig.mail;
      this.appConfig = fullConfig.app;

      if (!this.config) {
        log.mail.warn('Mail configuration not found in config.yaml');
      }
    } catch (error) {
      log.mail.error('Failed to load mail configuration', { error: error.message });
    }
  }

  /**
   * Get mail configuration
   */
  static getConfig() {
    if (!this.config) {
      this.init();
    }
    return this.config;
  }

  /**
   * Create nodemailer transporter
   */
  static createTransporter() {
    const mailConfig = this.getConfig();

    if (!mailConfig) {
      throw new Error('Mail configuration not available');
    }

    // Check for UI metadata format configuration
    if (
      !mailConfig.smtp_host?.value ||
      !mailConfig.smtp_port?.value ||
      !mailConfig.smtp_from?.value
    ) {
      throw new Error('Incomplete mail configuration. Missing smtp_host, smtp_port, or smtp_from');
    }

    // Build transporter configuration from UI metadata format
    const transporterConfig = {
      host: mailConfig.smtp_host.value,
      port: mailConfig.smtp_port.value,
      secure: mailConfig.smtp_secure?.value || false,
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
    };

    // Add authentication if provided
    if (mailConfig.smtp_user?.value && mailConfig.smtp_password?.value) {
      transporterConfig.auth = {
        user: mailConfig.smtp_user.value,
        pass: mailConfig.smtp_password.value,
      };
    }

    return nodemailer.createTransport(transporterConfig);
  }

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
  static async sendInvitationEmail(invitation) {
    try {
      const organizationName = invitation.organization?.name || 'your organization';
      const inviterName = invitation.invitedBy?.username || 'An administrator';

      log.mail.info('Attempting to send invitation email', {
        recipient: invitation.email,
        organization: organizationName,
      });

      const mailConfig = this.getConfig();
      if (!mailConfig) {
        throw new Error('Mail configuration not available');
      }

      const transporter = this.createTransporter();

      // Get frontend URL
      const frontendUrl = this.appConfig?.frontend_url || 'https://localhost:3001';

      // Create invitation link
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
  }

  /**
   * Send welcome email to new user
   * @param {Object} user - User object
   * @param {string} organizationName - Organization name
   * @returns {Promise<Object>} Email send result
   */
  static async sendWelcomeEmail(user, organizationName) {
    try {
      log.mail.info('Attempting to send welcome email', {
        recipient: user.email,
        username: user.username,
        organization: organizationName,
      });

      const mailConfig = this.getConfig();
      if (!mailConfig) {
        throw new Error('Mail configuration not available');
      }

      const transporter = this.createTransporter();

      // Get frontend URL
      const frontendUrl = this.appConfig?.frontend_url || 'https://localhost:3001';
      const loginUrl = `${frontendUrl}/login`;

      const mailOptions = {
        from: mailConfig.smtp_from.value,
        to: user.email,
        subject: `Welcome to Hyperweaver - ${organizationName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Hyperweaver</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #23d160; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; background-color: #3273dc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .button:hover { background-color: #2366d1; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Hyperweaver!</h1>
              </div>
              <div class="content">
                <h2>Hello ${user.username}!</h2>
                <p>Your account has been successfully created and you're now a member of the <strong>${organizationName}</strong> organization.</p>
                
                <p>You can now access Hyperweaver to:</p>
                <ul>
                  <li>🖥️ Manage virtual machines</li>
                  <li>📊 Monitor system performance</li>
                  <li>🔧 Administer infrastructure</li>
                  <li>👥 Collaborate with your team</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" class="button">Login to Hyperweaver</a>
                </div>

                <p><strong>Your Account Details:</strong></p>
                <ul>
                  <li><strong>Username:</strong> ${user.username}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
                  <li><strong>Organization:</strong> ${organizationName}</li>
                  <li><strong>Role:</strong> ${user.role}</li>
                </ul>

                <div class="footer">
                  <p>If you have any questions or need assistance, please contact your organization administrator or check our documentation.</p>
                  <p>Welcome aboard! 🚀</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to Hyperweaver!

Hello ${user.username}!

Your account has been successfully created and you're now a member of the ${organizationName} organization.

You can now access Hyperweaver to:
- Manage virtual machines
- Monitor system performance  
- Administer infrastructure
- Collaborate with your team

Your Account Details:
- Username: ${user.username}
- Email: ${user.email}
- Organization: ${organizationName}
- Role: ${user.role}

Login to Hyperweaver: ${loginUrl}

If you have any questions or need assistance, please contact your organization administrator or check our documentation.

Welcome aboard!
        `,
      };

      log.mail.info('Sending welcome email');
      const info = await transporter.sendMail(mailOptions);

      log.mail.info('Welcome email sent successfully', { messageId: info.messageId });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Welcome email sent successfully',
      };
    } catch (error) {
      log.mail.error('Error sending welcome email', {
        error: error.message,
        username: user.username,
        email: user.email,
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to send welcome email',
      };
    }
  }

  /**
   * Test SMTP connection and send test email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testSmtpConnection(req, res) {
    try {
      const { testEmail } = req.body;

      log.mail.info('Testing SMTP connection', { testEmail });

      const mailConfig = this.getConfig();
      if (!mailConfig) {
        return res.status(500).json({
          success: false,
          message: 'Mail configuration not available',
        });
      }
      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'Test email address is required',
        });
      }

      const transporter = this.createTransporter();

      log.mail.debug('Verifying SMTP connection');
      await transporter.verify();
      log.mail.info('SMTP connection verified successfully');

      log.mail.info('Sending test email');
      const info = await transporter.sendMail({
        from: mailConfig.smtp_from.value,
        to: testEmail,
        subject: 'Hyperweaver SMTP Test Email',
        html: `
          <h2>🧪 SMTP Configuration Test</h2>
          <p>This is a test email to verify your Hyperweaver SMTP configuration.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${mailConfig.smtp_from.value}</p>
          <p><strong>SMTP Host:</strong> ${mailConfig.smtp_host.value}:${mailConfig.smtp_port.value}</p>
          <p>✅ If you received this email, your SMTP configuration is working correctly!</p>
        `,
        text: `
Hyperweaver SMTP Test Email

This is a test email to verify your Hyperweaver SMTP configuration.

Timestamp: ${new Date().toISOString()}
From: ${mailConfig.smtp_from.value}
SMTP Host: ${mailConfig.smtp_host.value}:${mailConfig.smtp_port.value}

✅ If you received this email, your SMTP configuration is working correctly!
        `,
      });

      log.mail.info('Test email sent successfully', { messageId: info.messageId });

      return res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info) || null,
      });
    } catch (error) {
      log.mail.error('SMTP test failed', {
        error: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        success: false,
        message: 'SMTP test failed',
        error: error.message,
        details: error.response || null,
      });
    }
  }
}

export default MailController;
