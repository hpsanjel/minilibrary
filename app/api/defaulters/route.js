import prisma from "@/lib/prisma";

// Get all defaulters (users with overdue books)
export async function GET() {
	const now = new Date();

	const defaulters = await prisma.transaction.findMany({
		where: {
			returned: false, // Book not returned yet
			deadline: {
				lt: now, // Deadline has passed
			},
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					phone: true,
				},
			},
			book: {
				select: {
					id: true,
					title: true,
					author: true,
					isbn: true,
				},
			},
		},
		orderBy: {
			deadline: "asc", // Oldest overdue first
		},
	});

	// Calculate days overdue for each transaction
	const defaultersWithOverdueDays = defaulters.map((transaction) => {
		const deadlineDate = new Date(transaction.deadline);
		const daysOverdue = Math.floor((now - deadlineDate) / (1000 * 60 * 60 * 24));

		return {
			...transaction,
			daysOverdue,
		};
	});

	return new Response(JSON.stringify(defaultersWithOverdueDays), {
		headers: { "Content-Type": "application/json" },
	});
}
