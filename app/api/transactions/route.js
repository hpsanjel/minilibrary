import prisma from "@/lib/prisma";
import { sendBookIssuedEmail } from "@/lib/sendBookIssuedEmail";
import sendBookReturnedEmail from "@/lib/sendBookReturnedEmail";

export async function POST(req) {
	try {
		const { userId, bookId } = await req.json();
		if (!userId || !bookId) {
			return new Response(JSON.stringify({ error: "User and Book are required." }), { status: 400 });
		}
		// Check user exists and is verified
		const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
		if (!user) return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
		if (user.verifiedUser !== "Yes") return new Response(JSON.stringify({ error: "User is not verified." }), { status: 403 });
		// Check book exists and is available
		const book = await prisma.book.findUnique({ where: { id: Number(bookId) } });
		if (!book) return new Response(JSON.stringify({ error: "Book not found." }), { status: 404 });
		if (!book.available || book.copies < 1) return new Response(JSON.stringify({ error: "Book is not available." }), { status: 400 });
		// Check user borrow limit
		const activeBorrows = await prisma.transaction.count({ where: { userId: Number(userId), returned: false } });
		if (activeBorrows >= 2) return new Response(JSON.stringify({ error: "User has reached borrow limit." }), { status: 400 });
		// Set deadline 30 days from now
		const deadline = new Date();
		deadline.setDate(deadline.getDate() + 30);
		const transaction = await prisma.transaction.create({
			data: {
				userId: Number(userId),
				bookId: Number(bookId),
				deadline,
			},
		});
		// Decrement book copies
		await prisma.book.update({
			where: { id: Number(bookId) },
			data: { copies: { decrement: 1 } },
		});

		// Send confirmation email
		try {
			await sendBookIssuedEmail({
				to: user.email,
				userName: user.name || user.email,
				bookTitle: book.title,
				bookAuthor: book.author,
				deadline: deadline.toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric" }),
				transactionId: transaction.id,
			});
		} catch (emailErr) {
			console.error("Failed to send issue confirmation email", emailErr);
		}

		return new Response(JSON.stringify(transaction));
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
	}
}

export async function GET() {
	const transactions = await prisma.transaction.findMany({
		include: { user: true, book: true },
		orderBy: { createdAt: "desc" },
	});
	return new Response(JSON.stringify(transactions));
}

export async function PATCH(req) {
	try {
		const { id, action, sendEmailConfirmation } = await req.json();

		// Find the transaction to get the bookId
		const transactionRecord = await prisma.transaction.findUnique({
			where: { id },
		});

		if (!transactionRecord) {
			return new Response(JSON.stringify({ error: "Transaction not found" }), {
				status: 404,
			});
		}

		if (action === "clearFine") {
			// Set fine to 0 for this transaction and clear returnedAt if needed
			const transaction = await prisma.transaction.update({
				where: { id },
				data: { fine: 0 },
			});
			return new Response(JSON.stringify(transaction));
		}

		if (action === "return") {
			// Calculate fine if overdue
			let fine = 0;
			if (transactionRecord.deadline && new Date() > new Date(transactionRecord.deadline)) {
				const daysLate = Math.ceil((new Date() - new Date(transactionRecord.deadline)) / (1000 * 60 * 60 * 24));
				fine = daysLate * 5;
			}

			// Get user and book data for email
			const user = await prisma.user.findUnique({
				where: { id: transactionRecord.userId },
			});
			const book = await prisma.book.findUnique({
				where: { id: transactionRecord.bookId },
			});

			// Mark transaction as returned, set fine, and set returnedAt
			const transaction = await prisma.transaction.update({
				where: { id },
				data: { returned: true, fine, returnedAt: new Date() },
			});

			// Increment book copies and update availability if needed
			const updatedBook = await prisma.book.update({
				where: { id: transactionRecord.bookId },
				data: { copies: { increment: 1 } },
			});
			if (updatedBook.copies > 0 && !updatedBook.available) {
				await prisma.book.update({
					where: { id: updatedBook.id },
					data: { available: true },
				});
			}

			// Send return confirmation email only if requested
			if (sendEmailConfirmation) {
				try {
					await sendBookReturnedEmail({
						to: user.email,
						userName: user.name || user.email,
						bookTitle: book.title,
						bookAuthor: book.author,
						returnedAt: transaction.returnedAt.toLocaleString("en-GB", {
							year: "numeric",
							month: "short",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						}),
						fine: fine,
						transactionId: transaction.id,
					});
				} catch (emailErr) {
					console.error("Failed to send return confirmation email", emailErr);
				}
			}

			return new Response(JSON.stringify(transaction));
		}

		if (action === "issue") {
			// Ensure book is available
			const book = await prisma.book.findUnique({
				where: { id: transactionRecord.bookId },
			});
			if (!book || book.copies <= 0) {
				return new Response(JSON.stringify({ error: "Book not available" }), {
					status: 400,
				});
			}
			// Ensure user is verified
			const user = await prisma.user.findUnique({ where: { id: transactionRecord.userId } });
			if (!user || user.verifiedUser !== "Yes") {
				return new Response(JSON.stringify({ error: "User is not verified to borrow books" }), {
					status: 403,
				});
			}

			// Set new deadline 30 days from now (to match borrow logic)
			const newDeadline = new Date();
			newDeadline.setDate(newDeadline.getDate() + 30);
			// Create a new transaction record
			const newTransaction = await prisma.transaction.create({
				data: {
					userId: transactionRecord.userId,
					bookId: transactionRecord.bookId,
					returned: false,
					createdAt: new Date(),
					deadline: newDeadline,
					fine: 0,
					returnedAt: null,
				},
				include: { user: true, book: true },
			});

			// Decrement book copies
			await prisma.book.update({
				where: { id: transactionRecord.bookId },
				data: { copies: { decrement: 1 } },
			});

			// Send confirmation email for re-issue
			try {
				await sendBookIssuedEmail({
					to: user.email,
					userName: user.name || user.email,
					bookTitle: book.title,
					bookAuthor: book.author,
					deadline: newDeadline.toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric" }),
					transactionId: newTransaction.id,
				});
			} catch (emailErr) {
				console.error("Failed to send re-issue confirmation email", emailErr);
			}

			return new Response(JSON.stringify(newTransaction));
		}

		return new Response(JSON.stringify({ error: "Invalid action" }), {
			status: 400,
		});
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
