import { log } from '../../utils/Logger.js';
import { getConfig, getAppConfig, createTransporter } from './transport.js';

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} organizationName - Organization name
 * @returns {Promise<Object>} Email send result
 */
export const sendWelcomeEmail = async (user, organizationName) => {
  try {
    log.mail.info('Attempting to send welcome email', {
      recipient: user.email,
      username: user.username,
      organization: organizationName,
    });

    const mailConfig = getConfig();
    if (!mailConfig) {
      throw new Error('Mail configuration not available');
    }

    const transporter = createTransporter();

    const frontendUrl = getAppConfig()?.frontend_url || 'https://localhost:3001';
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
};
