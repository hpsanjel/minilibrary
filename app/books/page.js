import BooksPageClient from "@/components/BooksPageClient";
import prisma from "@/lib/prisma";

export default async function BooksPage() {
	try {
		console.log("BooksPage: Fetching books from database...");
		const booksData = await prisma.book.findMany();
		console.log(`BooksPage: Successfully fetched ${booksData.length} books`);

		// Serialize the data to avoid Next.js serialization errors
		// This converts any special types (Date, BigInt, etc.) to plain JSON
		const books = JSON.parse(JSON.stringify(booksData));
		console.log("BooksPage: Data serialized successfully");

		return (
			<div className="max-w-4xl mx-auto">
				<BooksPageClient books={books} />
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
