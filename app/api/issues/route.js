import prisma from "@/lib/prisma";
import { sendBookIssuedEmail } from "@/lib/sendBookIssuedEmail";

// Get all issued books (unreturned transactions)
export async function GET() {
	const issues = await prisma.transaction.findMany({
		where: {
			returned: false, // Only show books that are currently issued (not returned)
		},
		include: {
			User: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			Book: {
				select: {
					id: true,
					title: true,
					author: true,
					isbn: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
	return new Response(JSON.stringify(issues));
}

// Create a new issue (issue a book - this should probably be handled by transactions API)
export async function POST(req) {
	try {
		const { userId, bookId } = await req.json();
		const userIdInt = parseInt(userId);
		const bookIdInt = parseInt(bookId);

		// Validate input
		if (!userIdInt || !bookIdInt || isNaN(userIdInt) || isNaN(bookIdInt)) {
			return new Response(JSON.stringify({ error: "Invalid user ID or book ID" }), { status: 400 });
		}

		// Check if user exists and is verified
		const user = await prisma.user.findUnique({
			where: { id: userIdInt },
			select: { id: true, name: true, email: true, verifiedUser: true },
		});

		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
		}

		if (user.verifiedUser !== "Yes") {
			return new Response(JSON.stringify({ error: "Only verified users can borrow books" }), { status: 403 });
		}

		// Check if book exists and is available
		const book = await prisma.book.findUnique({
			where: { id: bookIdInt },
			select: { id: true, title: true, author: true, isbn: true, available: true, copies: true },
		});

		if (!book) {
			return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });
		}

		if (!book.available || book.copies < 1) {
			return new Response(JSON.stringify({ error: "Book is not available for borrowing" }), { status: 400 });
		}

		// Check user's current active borrows (2-book limit)
		const activeBorrows = await prisma.transaction.count({
			where: {
				userId: userIdInt,
				returned: false,
			},
		});

		if (activeBorrows >= 2) {
			// Check if user is trying to borrow the same book again
			const existingTransaction = await prisma.transaction.findFirst({
				where: {
					userId: userIdInt,
					bookId: bookIdInt,
					returned: false,
				},
			});

			if (existingTransaction) {
				return new Response(JSON.stringify({ error: "You have already borrowed this book" }), { status: 400 });
			}

			return new Response(JSON.stringify({ error: "You can only borrow a maximum of 2 books at a time. Please return a book before borrowing another." }), { status: 400 });
		}

		// Set deadline to 30 days from now
		const deadline = new Date();
		deadline.setDate(deadline.getDate() + 30);

		// Create the transaction
		const issue = await prisma.transaction.create({
			data: {
				userId: userIdInt,
				bookId: bookIdInt,
				returned: false,
				deadline: deadline,
			},
			include: {
				User: { select: { id: true, name: true, email: true, role: true } },
				Book: { select: { id: true, title: true, author: true, isbn: true } },
			},
		});

		// Update book copies and availability
		const updatedBook = await prisma.book.update({
			where: { id: bookIdInt },
			data: {
				copies: { decrement: 1 },
			},
		});

		// If no copies left, mark book as unavailable
		if (updatedBook.copies <= 0) {
			await prisma.book.update({
				where: { id: bookIdInt },
				data: { available: false },
			});
		}

		// Send confirmation email to student
		try {
			await sendBookIssuedEmail({
				to: user.email,
				userName: user.name || user.email,
				bookTitle: book.title,
				bookAuthor: book.author,
				deadline: deadline.toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric" }),
				transactionId: issue.id,
			});
		} catch (emailErr) {
			console.error("Failed to send issue confirmation email", emailErr);
		}

		return new Response(JSON.stringify(issue), { status: 201 });
	} catch (error) {
		console.error("Error creating issue:", error);
		return new Response(JSON.stringify({ error: "Failed to borrow book" }), { status: 500 });
	}
}

// Update an issue (e.g., mark as returned)
export async function PATCH(req) {
	const { id, returned, returnedAt, condition, returnNotes } = await req.json();
	const issue = await prisma.transaction.update({
		where: { id: parseInt(id) },
		data: {
			returned: returned || false,
			returnedAt: returnedAt ? new Date(returnedAt) : null,
			condition,
			returnNotes,
		},
		include: {
			User: { select: { id: true, name: true, email: true, role: true } },
			Book: { select: { id: true, title: true, author: true, isbn: true } },
		},
	});
	return new Response(JSON.stringify(issue));
}

// Delete an issue (delete a transaction)
export async function DELETE(req) {
	const { id } = await req.json();
	await prisma.transaction.delete({ where: { id: parseInt(id) } });
	return new Response(JSON.stringify({ success: true }));
}
