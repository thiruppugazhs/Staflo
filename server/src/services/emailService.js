const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER || 'dailyflow.noreply@gmail.com';
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const CLIENT_URL = process.env.CLIENT_URL || 'https://dailyflow.thiruppugazhs.in';

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error('❌ Gmail SMTP Verification Failed:', error.message);
    } else {
      console.log('📧 Gmail SMTP Transporter is verified & ready to dispatch emails.');
    }
  });
} else {
  console.warn('⚠️ EMAIL_PASS environment variable is missing on this server. Emails will be simulated in server logs.');
}

/**
 * Send Welcome Email with Temporary Credentials
 */
async function sendWelcomeCredentialsEmail({ toEmail, name, tempPassword, role, loginUrl = `${CLIENT_URL}/login` }) {
  const roleName = role === 'HR' ? 'HR Officer' : role === 'ADMIN' ? 'Administrator' : 'Team Member';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf9; margin: 0; padding: 20px; color: #1c1917; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .header { border-bottom: 2px solid #fef3c7; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #1c1917; margin: 0; }
        .sublogo { font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
        .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .info-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .info-row { margin-bottom: 10px; font-size: 13px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { font-size: 11px; font-weight: 700; color: #713f12; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 14px; font-weight: 800; font-family: monospace; color: #1c1917; margin-top: 2px; }
        .btn { display: inline-block; background-color: #f59e0b; color: #1c1917; text-decoration: none; padding: 12px 28px; font-weight: 800; font-size: 13px; border-radius: 10px; margin-top: 20px; text-align: center; }
        .footer { margin-top: 32px; font-size: 11px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 16px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Daily Flow</div>
          <div class="sublogo">by ORCESCALE</div>
        </div>

        <div class="greeting">Welcome to the Team, ${name}!</div>
        <p style="font-size: 13px; line-height: 1.6; color: #44403c;">
          Your official workspace account has been created as <b>${roleName}</b>. You can now access your daily attendance, salary slips, announcements, and helpdesk.
        </p>

        <div class="info-box">
          <div class="info-row">
            <div class="info-label">Your Work Email:</div>
            <div class="info-value">${toEmail}</div>
          </div>
          <div class="info-row" style="margin-top: 12px;">
            <div class="info-label">Initial Temporary Password (Your Mobile Number):</div>
            <div class="info-value" style="font-size: 16px; color: #b45309;">${tempPassword}</div>
          </div>
        </div>

        <p style="font-size: 12px; color: #78716c; margin-top: 16px;">
          ⚠️ <b>Security Notice:</b> For your security, you will be prompted to change your temporary password immediately upon your first sign-in.
        </p>

        <div style="text-align: center;">
          <a href="${loginUrl}" class="btn">Sign In to Daily Flow →</a>
        </div>

        <div class="footer">
          If you did not request this account or believe this was sent in error, please contact your organization HR Administrator.<br>
          © ${new Date().getFullYear()} Daily Flow by ORCESCALE. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n📧 [EMAIL SIMULATION] Welcome Email for ${toEmail}:`);
    console.log(`   To: ${toEmail} (${name})`);
    console.log(`   Role: ${roleName}`);
    console.log(`   Temporary Password: ${tempPassword}`);
    console.log(`   Login URL: ${loginUrl}\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Daily Flow Workspace" <${EMAIL_USER}>`,
      to: toEmail,
      subject: `Welcome to Daily Flow — Your Account Credentials (${name})`,
      html: htmlContent,
    });
    console.log(`✅ Welcome email dispatched to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Password Reset OTP Email
 */
async function sendPasswordResetOtpEmail({ toEmail, otpCode }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf9; margin: 0; padding: 20px; color: #1c1917; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 32px; }
        .otp-box { background: #fefce8; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; font-family: monospace; color: #1c1917; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="margin: 0 0 16px; font-size: 20px;">Reset Your Daily Flow Password</h2>
        <p style="font-size: 13px; color: #44403c; line-height: 1.5;">
          Use the 6-digit verification code below to reset your account password. This code will expire in 10 minutes.
        </p>

        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>

        <p style="font-size: 12px; color: #78716c;">
          If you did not request a password reset, please ignore this message.
        </p>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n📧 [EMAIL SIMULATION] Password Reset OTP for ${toEmail}: ${otpCode}\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Daily Flow Security" <${EMAIL_USER}>`,
      to: toEmail,
      subject: `Your Daily Flow Password Reset Code: ${otpCode}`,
      html: htmlContent,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendWelcomeCredentialsEmail,
  sendPasswordResetOtpEmail,
};
