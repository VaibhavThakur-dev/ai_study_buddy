import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function otpEmailHTML(otp: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:40px;">
        <tr><td>
          <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Verify your email</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
            Use the code below to complete your <strong>AI Study Buddy</strong> registration.
          </p>

          <div style="background:#f3f4f6;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
              Verification Code
            </p>
            <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:14px;color:#111827;font-family:monospace;">
              ${otp}
            </p>
          </div>

          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} AI Study Buddy
      </p>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  // Dev fallback — no SMTP configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`  [DEV] OTP for ${to}: ${otp}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    return
  }

  const transporter = createTransporter()
  await transporter.sendMail({
    from: `"AI Study Buddy" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your AI Study Buddy verification code`,
    html: otpEmailHTML(otp),
    text: `Your AI Study Buddy verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
  })
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function passwordResetEmailHTML(otp: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:40px;">
        <tr><td>
          <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
            Use the code below to reset your <strong>AI Study Buddy</strong> password.
          </p>

          <div style="background:#f3f4f6;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
              Reset Code
            </p>
            <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:14px;color:#111827;font-family:monospace;">
              ${otp}
            </p>
          </div>

          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} AI Study Buddy
      </p>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendPasswordResetEmail(to: string, otp: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`  [DEV] Password reset OTP for ${to}: ${otp}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    return
  }

  const transporter = createTransporter()
  await transporter.sendMail({
    from: `"AI Study Buddy" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your AI Study Buddy password reset code`,
    html: passwordResetEmailHTML(otp),
    text: `Your AI Study Buddy password reset code is: ${otp}\n\nThis code expires in 10 minutes.`,
  })
}
