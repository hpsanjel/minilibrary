// This script should be run daily (e.g. via cron) to send reminder emails 3 days before deadline.
import prisma from "@/lib/prisma";
import { sendBookReminderEmail } from "@/lib/sendBookReminderEmail";

async function sendReminders() {
	const now = new Date();
	const threeDaysFromNow = new Date(now);
	threeDaysFromNow.setDate(now.getDate() + 3);
	threeDaysFromNow.setHours(0, 0, 0, 0);

	// Find all transactions due in exactly 3 days and not yet returned
	const transactions = await prisma.transaction.findMany({
		where: {
			returned: false,
			deadline: {
				gte: threeDaysFromNow,
				lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000),
			},
		},
		include: { user: true, book: true },
	});

	for (const tx of transactions) {
		if (!tx.user?.email) continue;
		try {
			await sendBookReminderEmail({
				to: tx.user.email,
				userName: tx.user.name || tx.user.email,
				bookTitle: tx.book.title,
				bookAuthor: tx.book.author,
				deadline: tx.deadline.toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric" }),
				transactionId: tx.id,
			});
			console.log(`Reminder sent to ${tx.user.email} for book ${tx.book.title}`);
		} catch (err) {
			console.error(`Failed to send reminder to ${tx.user.email}:`, err);
		}
	}
}

sendReminders().then(() => process.exit(0));
