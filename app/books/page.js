import BooksPageClient from "@/components/BooksPageClient";
import prisma from "@/lib/prisma";
export default async function BooksPage() {
	const books = await prisma.book.findMany();
	return (
		<div className="max-w-4xl mx-auto">
			<BooksPageClient books={books} />
		</div>
	);
}
