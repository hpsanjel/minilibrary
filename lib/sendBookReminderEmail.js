import nodemailer from "nodemailer";

export async function sendBookReminderEmail({ to, userName, bookTitle, bookAuthor, deadline, transactionId }) {
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
		subject: `Book Return Reminder: ${bookTitle}`,
		html: `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: #eab308;">Book Return Reminder</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>This is a friendly reminder that your borrowed book is due in 3 days:</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 8px; font-weight: bold;">Title:</td><td style="padding: 4px 8px;">${bookTitle}</td></tr>
          <tr><td style="padding: 4px 8px; font-weight: bold;">Author:</td><td style="padding: 4px 8px;">${bookAuthor}</td></tr>
          <tr><td style="padding: 4px 8px; font-weight: bold;">Deadline:</td><td style="padding: 4px 8px;">${deadline}</td></tr>
          <tr><td style="padding: 4px 8px; font-weight: bold;">Transaction ID:</td><td style="padding: 4px 8px;">${transactionId}</td></tr>
        </table>
        <p>Please return the book by the deadline to avoid late fees.</p>
        <p>Thank you for using Mini Library!</p>
        <hr style="margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">If you have already returned the book, please ignore this message.</p>
      </div>
    `,
	};

	await transporter.sendMail(mailOptions);
}
