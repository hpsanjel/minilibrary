import prisma from "@/lib/prisma";

// Get all issued books (unreturned transactions)
export async function GET() {
	const issues = await prisma.transaction.findMany({
		where: {
			returned: false, // Only show books that are currently issued (not returned)
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
		orderBy: { createdAt: "desc" },
	});
	return new Response(JSON.stringify(issues));
}

// Create a new issue (issue a book - this should probably be handled by transactions API)
export async function POST(req) {
	const { userId, bookId } = await req.json();
	const issue = await prisma.transaction.create({
		data: {
			userId: parseInt(userId),
			bookId: parseInt(bookId),
			returned: false,
			deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
		},
		include: {
			user: { select: { id: true, name: true, email: true, role: true } },
			book: { select: { id: true, title: true, author: true, isbn: true } },
		},
	});
	return new Response(JSON.stringify(issue));
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
			user: { select: { id: true, name: true, email: true, role: true } },
			book: { select: { id: true, title: true, author: true, isbn: true } },
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
