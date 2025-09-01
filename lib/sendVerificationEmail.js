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
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Thank you for signing up for Mini Library. Please verify your email address by clicking the button below:</p>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${verificationUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email</a>
        </p>
        <p>If you did not sign up, you can ignore this email.</p>
        <hr style="margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">This link will expire in 24 hours.</p>
      </div>
    `,
	};

	await transporter.sendMail(mailOptions);
}
