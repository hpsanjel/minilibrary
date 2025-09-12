import prisma from "@/lib/prisma";

// Get all returned books (returned transactions)
export async function GET() {
	const returns = await prisma.transaction.findMany({
		where: {
			returned: true, // Only show books that have been returned
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
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
		orderBy: { returnedAt: "desc" },
	});
	return new Response(JSON.stringify(returns));
}

// Mark a book as returned (update transaction)
export async function PATCH(req) {
	const { transactionId, condition, returnNotes, fine } = await req.json();

	const transaction = await prisma.transaction.update({
		where: { id: parseInt(transactionId) },
		data: {
			returned: true,
			returnedAt: new Date(),
			condition: condition || "Good",
			returnNotes: returnNotes || null,
			fine: fine || 0,
		},
		include: {
			user: { select: { id: true, name: true, email: true, role: true } },
			book: { select: { id: true, title: true, author: true, isbn: true } },
		},
	});

	return new Response(JSON.stringify(transaction));
}

// Delete a return record (if needed)
export async function DELETE(req) {
	const { transactionId } = await req.json();

	const deletedTransaction = await prisma.transaction.delete({
		where: { id: parseInt(transactionId) },
	});

	return new Response(JSON.stringify({ message: "Return record deleted", deletedTransaction }));
}
