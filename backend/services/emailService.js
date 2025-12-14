const nodemailer = require('nodemailer');

/**
 * Email Service for sending emails
 * Supports both development (console logging) and production (actual email sending)
 */

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  // Check if email configuration is provided
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  // If no email credentials are configured, use a test account
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.log('⚠️  Email credentials not configured. Emails will be logged to console only.');
    console.log('💡 To enable email sending, set EMAIL_USER and EMAIL_PASSWORD in .env file');
    return null;
  }

  try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    return null;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - 6-character reset code
 * @returns {Promise<boolean>} - True if email sent successfully
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  const transporter = initializeTransporter();

  const mailOptions = {
    from: `"Job Portal" <${process.env.EMAIL_USER || 'noreply@jobportal.com'}>`,
    to: to,
    subject: 'Password Reset Code - Job Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #667eea;
            margin-top: 0;
            font-size: 24px;
          }
          .code-container {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .reset-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>🔐 Password Reset Request</h1>
            <p>Hello,</p>
            <p>You recently requested to reset your password for your Job Portal account. Use the code below to reset your password:</p>
            
            <div class="code-container">
              <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Your Reset Code</div>
              <div class="reset-code">${resetToken}</div>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password" class="button">
                Reset Password
              </a>
            </p>

            <div class="warning">
              <strong>⚠️ Important:</strong> This code will expire in <strong>15 minutes</strong> for security reasons.
            </div>

            <p><strong>Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.</p>

            <div class="footer">
              <p>This is an automated email from Job Portal. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request - Job Portal

You recently requested to reset your password for your Job Portal account.

Your Reset Code: ${resetToken}

This code will expire in 15 minutes.

Visit ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password to reset your password.

If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} Job Portal. All rights reserved.
    `
  };

  // If transporter is not initialized (no credentials), log to console
  if (!transporter) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL (Console Mode - Email not sent)');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Reset Code: ${resetToken}`);
    console.log('='.repeat(60) + '\n');
    return false;
  }

  // Send actual email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('📧 To:', to);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    // Still log to console as fallback
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL (Fallback - Email sending failed)');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Reset Code: ${resetToken}`);
    console.log('='.repeat(60) + '\n');
    return false;
  }
};

/**
 * Send welcome email (optional - can be used for new registrations)
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise<boolean>}
 */
const sendWelcomeEmail = async (to, name) => {
  const transporter = initializeTransporter();
  
  if (!transporter) {
    console.log(`📧 Welcome email would be sent to: ${to} (${name})`);
    return false;
  }

  const mailOptions = {
    from: `"Job Portal" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Welcome to Job Portal! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          h1 {
            color: #667eea;
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>Welcome to Job Portal, ${name}! 🎉</h1>
            <p>Thank you for joining our community. We're excited to have you on board!</p>
            <p>Start exploring job opportunities or post your first job listing today.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return false;
  }
};

/**
 * Send suspicious login alert email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {Object} loginActivity - Login activity details
 * @returns {Promise<boolean>}
 */
const sendSuspiciousLoginAlert = async (to, name, loginActivity) => {
  const transporter = initializeTransporter();

  const reasonsText = loginActivity.suspiciousReasons.map(reason => {
    switch(reason) {
      case 'new_ip': return 'New IP address';
      case 'new_country': return 'Login from a new country';
      case 'new_device': return 'New browser or device';
      case 'new_os': return 'New operating system';
      case 'unusual_time': return 'Login at an unusual time';
      case 'multiple_failed_attempts': return 'Multiple failed login attempts detected';
      default: return reason;
    }
  }).join(', ');

  const mailOptions = {
    from: `"Job Portal Security" <${process.env.EMAIL_USER || 'security@jobportal.com'}>`,
    to: to,
    subject: '🔐 Security Alert: Suspicious Login Detected',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            padding: 30px;
            border-radius: 10px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #dc2626;
            margin-top: 0;
            font-size: 24px;
          }
          .alert-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-item {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-item:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #666;
            display: inline-block;
            width: 120px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>🚨 Suspicious Login Detected</h1>
            <p>Hello ${name},</p>
            <p>We detected a login to your Job Portal account that appears suspicious based on unusual patterns.</p>
            
            <div class="alert-box">
              <strong>⚠️ Suspicious Indicators:</strong><br>
              ${reasonsText}
            </div>

            <div class="details-box">
              <h3 style="margin-top: 0;">Login Details:</h3>
              <div class="detail-item">
                <span class="detail-label">Time:</span>
                <span>${new Date(loginActivity.loginTime).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">IP Address:</span>
                <span>${loginActivity.ipAddress}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Location:</span>
                <span>${loginActivity.ipInfo.city}, ${loginActivity.ipInfo.countryName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Device:</span>
                <span>${loginActivity.device.browser} on ${loginActivity.device.os}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ISP:</span>
                <span>${loginActivity.ipInfo.org}</span>
              </div>
            </div>

            <p><strong>Was this you?</strong></p>
            <p>If you recognize this activity, you can safely ignore this email. Your account is secure.</p>

            <p><strong>Didn't recognize this login?</strong></p>
            <p>If this wasn't you, your account may have been compromised. Please take immediate action:</p>
            <ol>
              <li>Change your password immediately</li>
              <li>Review your recent account activity</li>
              <li>Enable two-factor authentication if available</li>
            </ol>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Secure My Account
              </a>
            </p>

            <div class="footer">
              <p>This is an automated security alert from Job Portal.</p>
              <p>&copy; ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Security Alert: Suspicious Login Detected - Job Portal

Hello ${name},

We detected a suspicious login to your Job Portal account.

Suspicious Indicators: ${reasonsText}

Login Details:
- Time: ${new Date(loginActivity.loginTime).toLocaleString()}
- IP Address: ${loginActivity.ipAddress}
- Location: ${loginActivity.ipInfo.city}, ${loginActivity.ipInfo.countryName}
- Device: ${loginActivity.device.browser} on ${loginActivity.device.os}
- ISP: ${loginActivity.ipInfo.org}

Was this you?
If you recognize this activity, you can safely ignore this email.

Didn't recognize this login?
If this wasn't you, please:
1. Change your password immediately
2. Review your recent account activity
3. Enable two-factor authentication if available

Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

© ${new Date().getFullYear()} Job Portal. All rights reserved.
    `
  };

  // If transporter is not initialized, log to console
  if (!transporter) {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 SUSPICIOUS LOGIN ALERT (Console Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`User: ${name}`);
    console.log(`Reasons: ${reasonsText}`);
    console.log(`Location: ${loginActivity.ipInfo.city}, ${loginActivity.ipInfo.countryName}`);
    console.log('='.repeat(60) + '\n');
    return false;
  }

  // Send actual email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Suspicious login alert sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send suspicious login alert:', error.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSuspiciousLoginAlert
};

