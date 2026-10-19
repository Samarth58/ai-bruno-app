import { env } from '../config/env.js';

export interface SendEmailOptions {
  toEmail: string;
  subject: string;
  textContent: string;
  htmlContent: string;
}

/**
 * Sends a transactional email using the Brevo HTTP API (v3/smtp/email).
 * Reuses the native fetch pattern established in HabitUp.
 * Safely handles and logs delivery failures without throwing or exposing secrets.
 */
export async function sendEmailViaBrevo(options: SendEmailOptions): Promise<boolean> {
  if (!env.BREVO_API_KEY) {
    console.warn(
      '[emailService] BREVO_API_KEY is not configured; email delivery skipped for recipient:',
      options.toEmail,
    );
    return false;
  }

  const senderEmail = env.BREVO_SENDER_EMAIL || 'no-reply@brunoaigymbuddy.com';
  const senderName = env.BREVO_SENDER_NAME || 'Bruno AI Gym Buddy';

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: options.toEmail }],
        subject: options.subject,
        textContent: options.textContent,
        htmlContent: options.htmlContent,
      }),
      signal: AbortSignal.timeout(10000), // 10 second network timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        '[emailService] Brevo HTTP API responded with error status:',
        response.status,
        errorText,
      );
      return false;
    }

    const result = (await response.json()) as { messageId?: string };
    console.log(
      '[emailService] Brevo transactional email dispatched successfully to:',
      options.toEmail,
      result.messageId || 'OK',
    );
    return true;
  } catch (error) {
    console.error(
      '[emailService] Exception while delivering email via Brevo to:',
      options.toEmail,
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

/**
 * Sends a mobile-friendly 6-digit password reset OTP email to the user.
 */
export async function sendPasswordResetOtpEmail(
  toEmail: string,
  otp: string,
  ttlMinutes: number,
): Promise<boolean> {
  const subject = 'Reset your Bruno AI Gym Buddy password';

  const textContent = [
    'Reset your Bruno AI Gym Buddy password',
    '',
    `Your six-digit verification code is: ${otp}`,
    '',
    `This code will expire in ${ttlMinutes} minutes.`,
    '',
    'For your security, please do not share this code with anyone.',
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    '— Bruno AI Gym Buddy Team',
  ].join('\n');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Bruno AI Gym Buddy password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Bruno AI Gym Buddy
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff; font-weight: 500;">
                Password Recovery Verification
              </p>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                You requested a password reset for your Bruno AI Gym Buddy account. Enter the 6-digit verification code below in your mobile app to proceed:
              </p>
              
              <!-- OTP Display Box -->
              <div style="background-color: #0f172a; border: 2px dashed #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; display: inline-block;">
                  ${otp}
                </span>
              </div>

              <!-- Metadata & Warnings -->
              <p style="margin: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #f1f5f9; text-align: center;">
                ⏳ This code expires in ${ttlMinutes} minutes.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                Never share this code with anyone. Bruno staff will never ask for your verification code.
              </p>

              <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                If you did not request a password reset, you can safely ignore this email. Your existing password and workouts remain secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 16px 32px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} Bruno AI Gym Buddy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmailViaBrevo({
    toEmail,
    subject,
    textContent,
    htmlContent,
  });
}
