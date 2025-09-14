import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export async function sendPasswordChangeRequestEmail({ to, userName, passwordChangeUrl }) {
	const mailOptions = {
		from: `Mini Library <${process.env.EMAIL_USER}>`,
		to,
		subject: "Password Change Request - Mini Library",
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Password Change Request</title>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
					.content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
					.button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
					.button:hover { background: #0056b3; }
					.warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
					.footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
				</style>
			</head>
			<body>
				<div class="header">
					<h1>🔐 Password Change Request</h1>
					<p>Mini Library System</p>
				</div>
				<div class="content">
					<h2>Hello ${userName}!</h2>
					<p>We received a request to change your password for your Mini Library account.</p>
					
					<p>If you requested this change, click the button below to proceed:</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${passwordChangeUrl}" 
						   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
							Change Your Password
						</a>
					</div>
					
					<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
						<strong>⚠️ Important Security Information:</strong>
						<ul style="margin: 10px 0; padding-left: 20px;">
							<li>This link will expire in <strong>1 hour</strong> for security reasons</li>
							<li>If you didn't request this change, please ignore this email</li>
							<li>Your current password will remain unchanged until you complete the process</li>
							<li>Never share this link with anyone</li>
						</ul>
					</div>
					
					<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
					<p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px;">
						${passwordChangeUrl}
					</p>
					
					<p>If you have any issues or didn't request this change, please contact our support team immediately.</p>
				</div>
				<div class="footer">
					<p>This email was sent from Mini Library System</p>
					<p>Please do not reply to this email</p>
				</div>
			</body>
			</html>
		`,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`Password change request email sent to ${to}`);
	} catch (error) {
		console.error("Error sending password change request email:", error);
		throw error;
	}
}
