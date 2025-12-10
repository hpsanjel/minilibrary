import BooksPageClient from "@/components/BooksPageClient";
import prisma from "@/lib/prisma";

export default async function BooksPage() {
	try {
		const booksData = await prisma.book.findMany({
			include: {
				Transaction: {
					where: { returned: false },
				},
			},
			orderBy: { title: "asc" },
		});
		console.log(`BooksPage: Successfully fetched ${booksData.length} books`);

		// Calculate availability and serialize
		const books = booksData.map((book) => {
			const borrowedCount = book.Transaction.length;
			const availableCopies = book.copies - borrowedCount;

			return {
				...book,
				Transaction: undefined, // Remove transactions to keep payload light
				available: book.available && availableCopies > 0,
				availableCopiesCount: availableCopies, // Useful for display
			};
		});

		// Serialize to plain JSON
		const serializedBooks = JSON.parse(JSON.stringify(books));
		console.log("BooksPage: Data processed and serialized successfully");

		return (
			<div className="max-w-4xl mx-auto">
				<BooksPageClient books={serializedBooks} />
			</div>
		);
	} catch (error) {
		console.error("BooksPage: Error loading books:", error);
		console.error("BooksPage: Error stack:", error.stack);

		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<h2 className="text-red-800 font-bold mb-2">Error Loading Books</h2>
					<p className="text-red-600 mb-2">Failed to load books from the database.</p>
					<p className="text-sm text-gray-600">Error: {error.message}</p>
				</div>
			</div>
		);
	}
}
