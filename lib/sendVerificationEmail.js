import nodemailer from "nodemailer";

export async function sendVerificationEmail({ to, userName, verificationUrl }) {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: `Mini Library <${process.env.EMAIL_USER}>`,
		to,
		subject: `Verify your email for Mini Library`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; text-align: center;">Verify Your Email</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Thank you for signing up for Mini Library. Please verify your email address by clicking the button below:</p>
        
        <!-- Mobile-friendly button with fallback -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: #2563eb; border-radius: 6px; padding: 12px 24px;">
                    <a href="${verificationUrl}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; display: block;">Verify Email</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Fallback plain text link for better mobile compatibility -->
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
          ${verificationUrl}
        </p>
        
        <p>If you did not sign up, you can ignore this email.</p>
        <hr style="margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">This link will expire in 24 hours.</p>
      </div>
    `,
	};

	await transporter.sendMail(mailOptions);
}
