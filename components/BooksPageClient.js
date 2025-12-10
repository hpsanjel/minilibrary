"use client";

import BooksExplorer from "@/components/BooksExplorer";
import { useSession } from "next-auth/react";
import BooksUserTabs from "@/components/BooksUserTabs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BooksPageClient({ books }) {
	const { data: session } = useSession();
	const searchParams = useSearchParams();
	const [selectedBook, setSelectedBook] = useState(null);

	// Check if there's a bookId in the URL query params
	useEffect(() => {
		const bookId = searchParams.get('bookId');
		if (bookId) {
			const book = books.find(b => b.id === parseInt(bookId));
			if (book) {
				setSelectedBook(book);
			}
		}
	}, [searchParams, books]);

	return (
		<div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row">
			<div className="flex-1 w-full">
				{session && <BooksUserTabs />}
				<h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Explore Books</h1>
				<BooksExplorer books={books} initialSelectedBook={selectedBook} />
			</div>
		</div>
	);
}
