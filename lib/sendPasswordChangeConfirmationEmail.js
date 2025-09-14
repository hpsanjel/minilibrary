import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export async function sendPasswordChangeConfirmationEmail(email, name) {
	const mailOptions = {
		from: `Mini Library <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Password Changed Successfully - Mini Library",
		html: `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Password Changed Successfully</title>
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Changed</h1>
				</div>
				
				<div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
					<p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
					
					<p style="font-size: 16px; margin-bottom: 20px;">
						Your password has been successfully changed for your Mini Library account.
					</p>
					
					<div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
						<p style="margin: 0; font-size: 14px;">
							<strong>✅ Security Notice:</strong> Your password change was completed successfully on ${new Date().toLocaleString()}.
						</p>
					</div>
					
					<p style="font-size: 16px; margin-bottom: 20px;">
						If you did not make this change, please contact our support team immediately.
					</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.NEXTAUTH_URL}/auth/signin" 
						   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
							Sign In to Your Account
						</a>
					</div>
					
					<div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
						<p style="font-size: 14px; color: #666; margin-bottom: 10px;">
							<strong>Security Tips:</strong>
						</p>
						<ul style="font-size: 14px; color: #666; margin: 0; padding-left: 20px;">
							<li>Use a strong, unique password for your library account</li>
							<li>Never share your password with anyone</li>
							<li>Sign out of your account when using public computers</li>
						</ul>
					</div>
					
					<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
						<p style="font-size: 14px; color: #666; margin: 0;">
							This is an automated message from Mini Library.<br>
							Please do not reply to this email.
						</p>
					</div>
				</div>
				
				<div style="text-align: center; margin-top: 20px;">
					<p style="font-size: 12px; color: #999;">
						© ${new Date().getFullYear()} Mini Library. All rights reserved.
					</p>
				</div>
			</body>
			</html>
		`,
		text: `
Password Changed Successfully - Mini Library

Dear ${name},

Your password has been successfully changed for your Mini Library account.

Security Notice: Your password change was completed successfully on ${new Date().toLocaleString()}.

If you did not make this change, please contact our support team immediately.

You can sign in to your account at: ${process.env.NEXTAUTH_URL}/auth/signin

Security Tips:
- Use a strong, unique password for your library account
- Never share your password with anyone
- Sign out of your account when using public computers

This is an automated message from Mini Library.
Please do not reply to this email.

© ${new Date().getFullYear()} Mini Library. All rights reserved.
		`,
	};

	await transporter.sendMail(mailOptions);
}
