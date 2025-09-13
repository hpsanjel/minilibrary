import nodemailer from "nodemailer";

async function sendFineClearedEmail({ to, userName, bookTitle, bookAuthor, fineAmount, transactionId }) {
	try {
		const transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: to,
			subject: "Fine Payment Confirmed - Thank You!",
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>Fine Payment Confirmed</title>
					<style>
						body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
						.container { max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
						.content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
						.book-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
						.amount { font-size: 24px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
						.footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
						.success-icon { font-size: 48px; margin-bottom: 20px; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<div class="success-icon">✅</div>
							<h1 style="margin: 0;">Fine Payment Confirmed!</h1>
							<p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your payment</p>
						</div>
						
						<div class="content">
							<p>Dear <strong>${userName}</strong>,</p>
							
							<p>We have successfully received and processed your fine payment. Your account is now clear and in good standing.</p>
							
							<div class="book-info">
								<h3 style="margin-top: 0; color: #059669;">📚 Book Details</h3>
								<p><strong>Title:</strong> ${bookTitle}</p>
								<p><strong>Author:</strong> ${bookAuthor}</p>
								<p><strong>Transaction ID:</strong> #${transactionId}</p>
							</div>
							
							<div class="amount">
								Amount Paid: ${fineAmount} NOK
							</div>
							
							<div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0;">
								<h4 style="color: #065f46; margin-top: 0;">✨ What's Next?</h4>
								<ul style="color: #047857; margin: 0;">
									<li>Your fine has been completely cleared</li>
									<li>You can continue borrowing books from our library</li>
									<li>Please return books on time to avoid future fines</li>
									<li>Visit our library or browse our online catalog for new books</li>
								</ul>
							</div>
							
							<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
								<p style="margin: 0; color: #92400e;">
									<strong>💡 Tip:</strong> Set reminders on your phone for book return dates to avoid future late fees!
								</p>
							</div>
							
							<p>Thank you for being a valued member of our library community. We appreciate your prompt payment and responsible library usage.</p>
							
							<p>Happy reading!</p>
							
							<p style="margin-top: 30px;">
								Best regards,<br>
								<strong>Mini Library Team</strong>
							</p>
						</div>
						
						<div class="footer">
							<p>This is an automated message. Please do not reply to this email.</p>
							<p>If you have any questions, please contact the library administration.</p>
						</div>
					</div>
				</body>
				</html>
			`,
		};

		await transporter.sendMail(mailOptions);
		console.log(`Fine cleared confirmation email sent to ${to}`);
	} catch (error) {
		console.error("Error sending fine cleared email:", error);
		throw error;
	}
}

export default sendFineClearedEmail;
