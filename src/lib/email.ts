import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL - no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await createTransport().sendMail({ from, to, subject, html });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: 'Reset your password',
    html: `
      <p>You requested a password reset for your swim team account.</p>
      <p>Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">Reset Password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}

export async function sendWelcomeEmail(to: string, firstName: string, password: string, loginUrl: string) {
  await sendEmail({
    to,
    subject: 'Your swim team account has been created',
    html: `
      <p>Hi ${firstName},</p>
      <p>Your swim team account has been created. Here are your login credentials:</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Email</td><td>${to}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Password</td><td>${password}</td></tr>
      </table>
      <p><a href="${loginUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">Sign In</a></p>
      <p>Please change your password after your first login.</p>
    `,
  });
}
