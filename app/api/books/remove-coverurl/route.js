import prisma from "@/lib/prisma";

export async function POST() {
	try {
		// Get the last 3 books
		const lastThreeBooks = await prisma.book.findMany({
			orderBy: { id: "desc" },
			take: 3,
			select: { id: true, title: true, coverUrl: true },
		});

		console.log("Last 3 books before update:", lastThreeBooks);

		// Update them to remove coverUrl
		const updatedBooks = [];
		for (const book of lastThreeBooks) {
			const updated = await prisma.book.update({
				where: { id: book.id },
				data: { coverUrl: null },
			});
			updatedBooks.push({ id: book.id, title: book.title, previousCoverUrl: book.coverUrl });
		}

		return new Response(
			JSON.stringify({
				message: `Successfully removed coverUrl from ${updatedBooks.length} books`,
				updatedBooks: updatedBooks,
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		console.error("Error removing coverUrl:", error);
		return new Response(JSON.stringify({ error: "Failed to remove coverUrl", details: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}
