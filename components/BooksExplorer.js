"use client";
import { useState, useMemo } from "react";
import BookCard from "@/components/BookCard";

export default function BooksExplorer({ books }) {
	const [search, setSearch] = useState("");
	const [onlyAvailable, setOnlyAvailable] = useState(false);

	const filteredBooks = useMemo(() => {
		let list = books;

		// filter by availability if checkbox checked
		if (onlyAvailable) list = list.filter((b) => b.available);

		// filter by search
		if (search.trim()) {
			const s = search.toLowerCase();
			list = list.filter((b) => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s));
		}

		return list;
	}, [search, onlyAvailable, books]);

	return (
		<div className="space-y-8">
			<div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
				<label className="flex items-center space-x-2 text-sm text-gray-700">
					<input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
					<span>View Only Available</span>
				</label>
				<input type="text" placeholder="Search by title or author..." className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				{filteredBooks.length === 0 ? (
					<div className="text-gray-500 italic col-span-full">No books found.</div>
				) : (
					filteredBooks.map((book) => (
						<div key={book.id} className="hover:scale-101 transition transform">
							<BookCard book={book} />
						</div>
					))
				)}
			</div>
		</div>
	);
}
