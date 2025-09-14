import prisma from "@/lib/prisma";
import { sendBookIssuedEmail } from "@/lib/sendBookIssuedEmail";
import sendBookReturnedEmail from "@/lib/sendBookReturnedEmail";
import sendFineClearedEmail from "@/lib/sendFineClearedEmailEnhanced";

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

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");
	const bookId = searchParams.get("bookId");

	if (userId) {
		// Get transactions for specific user
		const transactions = await prisma.transaction.findMany({
			where: { userId: parseInt(userId) },
			include: { user: true, book: true },
			orderBy: { createdAt: "desc" },
		});
		return new Response(JSON.stringify(transactions));
	} else if (bookId) {
		// Get transactions for specific book
		const transactions = await prisma.transaction.findMany({
			where: { bookId: parseInt(bookId) },
			include: { user: true, book: true },
			orderBy: { createdAt: "desc" },
		});
		return new Response(JSON.stringify(transactions));
	} else {
		// Get all transactions
		const transactions = await prisma.transaction.findMany({
			include: { user: true, book: true },
			orderBy: { createdAt: "desc" },
		});
		return new Response(JSON.stringify(transactions));
	}
}

export async function PATCH(req) {
	try {
		const requestData = await req.json();
		const { id, action, sendEmailConfirmation, userId } = requestData;

		if (action === "clearAllUserFines") {
			// Handle clearing all fines for a specific user
			if (!userId) {
				return new Response(JSON.stringify({ error: "User ID is required" }), {
					status: 400,
				});
			}

			// Get user data
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userId) },
			});

			if (!user) {
				return new Response(JSON.stringify({ error: "User not found" }), {
					status: 404,
				});
			}

			// Get all transactions with outstanding fines for this user
			const fineTransactions = await prisma.transaction.findMany({
				where: {
					userId: parseInt(userId),
					fine: { gt: 0 },
				},
				include: {
					book: true,
				},
			});

			if (fineTransactions.length === 0) {
				return new Response(JSON.stringify({ error: "No outstanding fines found" }), {
					status: 400,
				});
			}

			// Calculate total fines
			const totalFines = fineTransactions.reduce((sum, t) => sum + t.fine, 0);

			// Create fine payment records for each transaction
			const finePayments = await Promise.all(
				fineTransactions.map((tx) =>
					prisma.finePayment.create({
						data: {
							transactionId: tx.id,
							userId: parseInt(userId),
							amount: tx.fine,
							processedBy: "Admin", // TODO: Add actual admin user info from session
							notes: `Bulk fine cleared for ${tx.book.title}`,
						},
					})
				)
			);

			// Clear all fines
			await prisma.transaction.updateMany({
				where: {
					userId: parseInt(userId),
					fine: { gt: 0 },
				},
				data: { fine: 0 },
			});

			// Send email notification
			try {
				await sendFineClearedEmail({
					to: user.email,
					userName: user.name || user.email,
					totalAmount: totalFines,
					transactionCount: fineTransactions.length,
				});
			} catch (error) {
				console.error("Failed to send fine cleared email:", error);
				// Don't fail the operation if email fails
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: "All fines cleared successfully",
					totalCleared: totalFines,
					transactionsUpdated: fineTransactions.length,
				})
			);
		}

		// Find the transaction to get the bookId (for other actions)
		const transactionRecord = await prisma.transaction.findUnique({
			where: { id },
		});

		if (!transactionRecord) {
			return new Response(JSON.stringify({ error: "Transaction not found" }), {
				status: 404,
			});
		}

		if (action === "clearFine") {
			// Get user and book data for email before clearing the fine
			const user = await prisma.user.findUnique({
				where: { id: transactionRecord.userId },
			});
			const book = await prisma.book.findUnique({
				where: { id: transactionRecord.bookId },
			});

			if (!user || !book) {
				return new Response(JSON.stringify({ error: "User or book not found" }), {
					status: 404,
				});
			}

			// Store the fine amount before clearing it
			const clearedFineAmount = transactionRecord.fine;

			if (clearedFineAmount <= 0) {
				return new Response(JSON.stringify({ error: "No fine to clear" }), {
					status: 400,
				});
			}

			// Create a fine payment record
			const finePayment = await prisma.finePayment.create({
				data: {
					transactionId: id,
					userId: transactionRecord.userId,
					amount: clearedFineAmount,
					processedBy: "Admin", // TODO: Add actual admin user info from session
					notes: `Fine cleared for ${book.title}`,
				},
			});

			// Set fine to 0 for this transaction
			const transaction = await prisma.transaction.update({
				where: { id },
				data: { fine: 0 },
			});

			// Send fine cleared confirmation email
			try {
				await sendFineClearedEmail({
					to: user.email,
					userName: user.name || user.email,
					bookTitle: book.title,
					bookAuthor: book.author,
					fineAmount: clearedFineAmount,
					transactionId: transaction.id,
				});
				console.log(`Fine cleared email sent to ${user.email} for transaction ${transaction.id}`);
			} catch (emailErr) {
				console.error("Failed to send fine cleared email:", emailErr);
				// Don't fail the request if email fails
			}

			return new Response(
				JSON.stringify({
					transaction,
					finePayment,
					message: "Fine cleared and payment recorded",
				})
			);
		}

		if (action === "return") {
			const { clearFine, fineAmount } = requestData;

			// Calculate fine if overdue (unless being cleared)
			let fine = 0;
			let originalFineAmount = 0; // Track the original fine for email purposes

			if (transactionRecord.deadline && new Date() > new Date(transactionRecord.deadline)) {
				const daysLate = Math.floor((new Date() - new Date(transactionRecord.deadline)) / (1000 * 60 * 60 * 24));
				originalFineAmount = daysLate * 5;
				fine = clearFine ? 0 : originalFineAmount; // Set fine to 0 if clearing, otherwise use calculated amount
			}

			// Get user and book data for email
			const user = await prisma.user.findUnique({
				where: { id: transactionRecord.userId },
			});
			const book = await prisma.book.findUnique({
				where: { id: transactionRecord.bookId },
			});

			// Mark transaction as returned, set fine (0 if cleared), and set returnedAt
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

			// Create fine payment record if fine was cleared
			let finePayment = null;
			if (clearFine && fineAmount > 0) {
				try {
					finePayment = await prisma.finePayment.create({
						data: {
							transactionId: id,
							userId: transactionRecord.userId,
							amount: fineAmount,
							processedBy: "Admin", // TODO: Add actual admin user info from session
							notes: `Fine cleared during return for ${book.title}`,
						},
					});
				} catch (finePaymentErr) {
					console.error("Failed to record fine payment:", finePaymentErr);
					// Don't fail the request if fine payment recording fails
				}
			}

			// Send appropriate emails
			try {
				// Determine what fine amount to show in return email
				const emailFineAmount = clearFine && fineAmount > 0 ? fineAmount : originalFineAmount;

				console.log("Email debug:", {
					clearFine,
					fineAmount,
					originalFineAmount,
					emailFineAmount,
					transactionId: id,
				});

				// Send return confirmation email
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
					fine: emailFineAmount,
					transactionId: transaction.id,
				});

				// Send fine cleared email if fine was cleared
				if (clearFine && fineAmount > 0) {
					await sendFineClearedEmail({
						to: user.email,
						userName: user.name || user.email,
						bookTitle: book.title,
						bookAuthor: book.author,
						clearedAt: new Date().toLocaleString("en-GB", {
							year: "numeric",
							month: "short",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						}),
						fineAmount: fineAmount,
						transactionId: transaction.id,
					});
				}
			} catch (emailErr) {
				console.error("Failed to send confirmation emails", emailErr);
			}

			return new Response(
				JSON.stringify({
					transaction,
					finePayment,
					message: clearFine && fineAmount > 0 ? "Book returned and fine cleared" : "Book returned successfully",
				})
			);
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
