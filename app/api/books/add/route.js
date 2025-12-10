import prisma from "@/lib/prisma";

export async function POST(req) {
	try {
		const { title, author, isbn, copies, available, coverImage } = await req.json();

		// Validate required fields
		if (!title || !author) {
			return new Response(JSON.stringify({ error: "Title and author are required" }), { status: 400 });
		}

		const book = await prisma.book.create({
			data: {
				title,
				author,
				isbn: isbn || null,
				copies: copies !== undefined ? copies : 1,
				available: available !== undefined ? available : true,
				coverUrl: coverImage || null, // Store base64 image in coverUrl field
			},
		});

		return new Response(JSON.stringify(book), { status: 201 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Failed to add book" }), { status: 500 });
	}
}
