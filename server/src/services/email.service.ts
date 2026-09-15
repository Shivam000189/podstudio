import nodemailer from "nodemailer";
import { env } from "../config/env";

/**
 * If SMTP credentials are configured, creates a real Nodemailer transport.
 * Otherwise (dev mode), we skip sending and log to console so developers
 * don't need a mail server to test the OTP flow.
 */
const isSmtpConfigured = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })
  : null;

export const sendOtpEmail = async (
  email: string,
  code: string
): Promise<void> => {
  const expiryMinutes = env.otpExpiryMinutes;

  if (!transporter) {
    console.log(`[DEV OTP] for ${email}: ${code} (expires in ${expiryMinutes} min)`);
    return;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; background: #408a71; color: #fff; font-weight: 700; border-radius: 10px; font-size: 18px;">R</span>
        <span style="font-size: 20px; font-weight: 700; color: #1a1a2e; margin-left: 8px; vertical-align: middle;">PodStudio</span>
      </div>
      <h2 style="color: #1a1a2e; font-size: 22px; margin: 0 0 8px; text-align: center;">Your Join Code</h2>
      <p style="color: #666; font-size: 14px; text-align: center; margin: 0 0 24px;">
        Enter this code to join the studio session.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; background: #f0f4f3; padding: 16px 32px; border-radius: 12px; border: 2px solid #e0e8e5;">
          ${code}
        </span>
      </div>
      <p style="color: #999; font-size: 13px; text-align: center; margin: 24px 0 0;">
        This code expires in ${expiryMinutes} minutes. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: `${code} is your PodStudio join code`,
    text: `Your PodStudio join code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html,
  });
};
