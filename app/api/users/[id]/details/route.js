import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
	try {
		const { id } = await params;
		const userId = parseInt(id);

		// Get user with transaction details
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				transactions: {
					include: {
						book: {
							select: {
								title: true,
								author: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
			});
		}

		// Calculate statistics
		const activeBorrows = user.transactions.filter((t) => !t.returned).length;
		const totalFines = user.transactions.reduce((sum, t) => sum + (t.fine || 0), 0);
		const totalTransactions = user.transactions.length;
		const returnedBooks = user.transactions.filter((t) => t.returned).length;

		// Get active borrowed books details
		const activeBorrowsDetails = user.transactions
			.filter((t) => !t.returned)
			.map((t) => ({
				id: t.id,
				bookTitle: t.book?.title || "Unknown",
				borrowedAt: t.createdAt,
				deadline: t.deadline,
				fine: t.fine || 0,
			}));

		// Get fines details
		const finesDetails = user.transactions
			.filter((t) => t.fine && t.fine > 0)
			.map((t) => ({
				id: t.id,
				bookTitle: t.book?.title || "Unknown",
				fine: t.fine,
				returned: t.returned,
				returnedAt: t.returnedAt,
			}));

		const userDetails = {
			...user,
			activeBorrows,
			totalFines,
			totalTransactions,
			returnedBooks,
			activeBorrowsDetails,
			finesDetails,
		};

		// Remove sensitive data
		delete userDetails.password;
		delete userDetails.transactions;

		return new Response(JSON.stringify(userDetails));
	} catch (error) {
		console.error("Error fetching user details:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
