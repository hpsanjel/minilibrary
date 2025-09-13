import nodemailer from "nodemailer";

export async function sendVerificationSuccessEmail({ to, userName }) {
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
		subject: `Account Verified - Welcome to Mini Library!`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
					.content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
					.footer { background-color: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
					.success-icon { background-color: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px; }
					.welcome-section { background-color: white; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #10b981; }
					.features-list { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; }
					.feature-item { margin: 10px 0; padding: 8px; background-color: #f0f9f5; border-radius: 4px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="success-icon">✓</div>
						<h1>Account Verified Successfully!</h1>
					</div>
					<div class="content">
						<p>Dear <strong>${userName}</strong>,</p>
						<p>Congratulations! Your account has been successfully verified by our admin team.</p>
						
						<div class="welcome-section">
							<h3>🎉 Welcome to Mini Library!</h3>
							<p>You now have full access to our library management system. Here's what you can do:</p>
						</div>

						<div class="features-list">
							<h3>📚 Available Features:</h3>
							<div class="feature-item">
								<strong>📖 Browse Books:</strong> Explore our extensive collection of books
							</div>
							<div class="feature-item">
								<strong>📋 Borrow Books:</strong> Request books for borrowing with just a few clicks
							</div>
							<div class="feature-item">
								<strong>📊 Track History:</strong> View your borrowing history and due dates
							</div>
							<div class="feature-item">
								<strong>🔔 Email Notifications:</strong> Receive updates about your transactions
							</div>
						</div>

						<div class="welcome-section">
							<h3>🚀 Get Started:</h3>
							<p>Sign in to your account and start exploring our digital library today!</p>
							<p><strong>Next Steps:</strong></p>
							<ul>
								<li>Browse our book collection</li>
								<li>Update your profile information</li>
								<li>Start borrowing books</li>
							</ul>
						</div>

						<p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
						<p>Happy Reading! 📚</p>
					</div>
					<div class="footer">
						<p><strong>Mini Library Management System</strong></p>
						<p>Your gateway to knowledge and learning</p>
						<p>&copy; 2025 Mini Library. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`,
	};

	await transporter.sendMail(mailOptions);
}
