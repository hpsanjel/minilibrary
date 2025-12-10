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

		<div className="min-h-screen bg-gray-50/50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{session && (
					<div className="mb-12 animate-fade-in">
						<BooksUserTabs />
					</div>
				)}

				<div className="space-y-8">
					<div className="text-center max-w-2xl mx-auto mb-12">
						<h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-4">
							Explore Our <span className="text-blue-600">Library</span>
						</h1>
						<p className="text-lg text-gray-600">
							Discover your next great read from our curated collection of books.
						</p>
					</div>

					<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
						<BooksExplorer books={books} initialSelectedBook={selectedBook} />
					</div>
				</div>
			</div>
		</div>
	);
}
