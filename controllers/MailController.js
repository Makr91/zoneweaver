import nodemailer from 'nodemailer';
import { log } from '../utils/Logger.js';
import { getConfig, createTransporter } from './mail/transport.js';
import { sendInvitationEmail } from './mail/invitation.js';
import { sendWelcomeEmail } from './mail/welcome.js';

/**
 * Test SMTP connection and send test email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testSmtpConnection = async (req, res) => {
  try {
    const { testEmail } = req.body;

    log.mail.info('Testing SMTP connection', { testEmail });

    const mailConfig = getConfig();
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

    const transporter = createTransporter();

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
};

/**
 * @swagger
 * /api/mail/test:
 *   post:
 *     summary: Test SMTP mail configuration (Super-admin only)
 *     description: Test the SMTP configuration by attempting to connect to the mail server and send a test email.
 *     tags: [Mail Testing]
 *     security:
 *       - JwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testEmail]
 *             properties:
 *               testEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address to send the test message to.
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: SMTP connection test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Test email sent successfully"
 *       400:
 *         description: SMTP connection failed or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions (Super-admin required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const testMail = async (req, res) => {
  await testSmtpConnection(req, res);
};

const MailController = {
  sendInvitationEmail,
  sendWelcomeEmail,
  testSmtpConnection,
  testMail,
};

export default MailController;
