import prisma from "@/lib/prisma";

// export async function GET() {
// 	const books = await prisma.book.findMany();
// 	return new Response(JSON.stringify(books));
// }

export async function GET() {
	const books = await prisma.book.findMany({
		select: {
			id: true,
			title: true,
			author: true,
			isbn: true,
			copies: true,
			coverUrl: true, // include cover URL
			transactions: {
				where: {
					returned: false, // only count unreturned books
				},
			},
		},
		orderBy: {
			title: "asc",
		},
	});

	// Calculate available copies for each book
	const booksWithAvailable = books.map((book) => {
		const borrowedCount = book.transactions.length;
		const availableCopies = book.copies - borrowedCount;

		return {
			id: book.id,
			title: book.title,
			author: book.author,
			isbn: book.isbn,
			availableCopies: `${availableCopies} of ${book.copies} available`,
			coverUrl: book.coverUrl,
		};
	});

	return new Response(JSON.stringify(booksWithAvailable), {
		headers: { "Content-Type": "application/json" },
	});
}

export async function POST(req) {
	const { title, author, isbn, copies, coverUrl } = await req.json();
	const numCopies = copies !== undefined ? copies : 1;

	const book = await prisma.book.create({
		data: {
			title,
			author,
			isbn: isbn || null,
			copies: numCopies,
			available: numCopies > 0,
			coverUrl: coverUrl || null, // include coverUrl
		},
	});

	return new Response(JSON.stringify(book), {
		headers: { "Content-Type": "application/json" },
	});
}

export async function PATCH(req) {
	const { id, title, author, isbn, copies, coverUrl } = await req.json();
	const numCopies = copies !== undefined ? copies : 1;

	const book = await prisma.book.update({
		where: { id: parseInt(id) },
		data: {
			title,
			author,
			isbn: isbn || null,
			copies: numCopies,
			available: numCopies > 0,
			coverUrl: coverUrl || null, // include coverUrl
		},
	});

	return new Response(JSON.stringify(book), {
		headers: { "Content-Type": "application/json" },
	});
}

// export async function POST(req) {
// 	const { title, author, isbn, copies } = await req.json();
// 	const numCopies = copies !== undefined ? copies : 1;
// 	const book = await prisma.book.create({
// 		data: {
// 			title,
// 			author,
// 			isbn: isbn || null,
// 			copies: numCopies,
// 			available: numCopies > 0,
// 		},
// 	});
// 	return new Response(JSON.stringify(book));
// }

// export async function PATCH(req) {
// 	const { id, title, author, isbn, copies } = await req.json();
// 	const numCopies = copies !== undefined ? copies : 1;
// 	const book = await prisma.book.update({
// 		where: { id: parseInt(id) },
// 		data: {
// 			title,
// 			author,
// 			isbn: isbn || null,
// 			copies: numCopies,
// 			available: numCopies > 0,
// 		},
// 	});
// 	return new Response(JSON.stringify(book));
// }

export async function DELETE(req) {
	const { id } = await req.json();
	await prisma.book.delete({ where: { id: parseInt(id) } });
	return new Response(JSON.stringify({ success: true }));
}
