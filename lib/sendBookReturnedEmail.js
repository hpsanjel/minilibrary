import nodemailer from "nodemailer";

async function sendBookReturnedEmail({ to, userName, bookTitle, bookAuthor, returnedAt, fine, transactionId }) {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: to,
		subject: `Book Return Confirmation - ${bookTitle}`,
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
					.book-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #10b981; }
					.fine-info { background-color: #fef3c7; padding: 10px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>📚 Book Return Confirmation</h1>
					</div>
					<div class="content">
						<p>Dear <strong>${userName}</strong>,</p>
						<p>This email confirms that you have successfully returned the following book to our library:</p>
						
						<div class="book-details">
							<h3>📖 Book Details</h3>
							<p><strong>Title:</strong> ${bookTitle}</p>
							<p><strong>Author:</strong> ${bookAuthor}</p>
							<p><strong>Return Date:</strong> ${new Date(returnedAt).toLocaleDateString()}</p>
							<p><strong>Transaction ID:</strong> #${transactionId}</p>
						</div>

						${
							fine && fine > 0
								? `
						<div class="fine-info">
							<h3>💰 Fine Information</h3>
							<p><strong>Fine Amount:</strong> $${fine.toFixed(2)}</p>
							<p>Please settle this fine at your earliest convenience.</p>
						</div>
						`
								: '<p style="color: #10b981; font-weight: bold;">✅ No fine applicable - returned on time!</p>'
						}

						<p>Thank you for using our library services responsibly!</p>
						<p>Happy Reading! 📚</p>
					</div>
					<div class="footer">
						<p>&copy; 2025 Mini Library Management System</p>
					</div>
				</div>
			</body>
			</html>
		`,
	};

	await transporter.sendMail(mailOptions);
}

export default sendBookReturnedEmail;
