import prisma from "@/lib/prisma";

export async function POST() {
	try {
		// Get the maximum ID from the Book table
		const maxBook = await prisma.book.findFirst({
			orderBy: { id: "desc" },
			select: { id: true },
		});

		const maxId = maxBook ? maxBook.id : 0;
		const nextId = maxId + 1;

		// Reset the PostgreSQL sequence to the correct value
		await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Book"', 'id'), ${nextId}, false);`;

		return new Response(
			JSON.stringify({
				message: `Sequence reset successfully. Next ID will be: ${nextId}`,
				currentMaxId: maxId,
				nextId: nextId,
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		console.error("Sequence reset error:", error);
		return new Response(JSON.stringify({ error: "Failed to reset sequence", details: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}
