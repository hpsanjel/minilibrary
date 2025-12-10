"use client";
import { useState, useMemo, useEffect } from "react";
import BookCard from "@/components/BookCard";
import { X, BookOpen } from "lucide-react";
import Link from "next/link";

export default function BooksExplorer({ books, initialSelectedBook = null }) {
	const [search, setSearch] = useState("");
	const [onlyAvailable, setOnlyAvailable] = useState(false);
	const [selectedBook, setSelectedBook] = useState(initialSelectedBook);

	// Update selected book when initialSelectedBook changes
	useEffect(() => {
		if (initialSelectedBook) {
			setSelectedBook(initialSelectedBook);
		}
	}, [initialSelectedBook]);

	const filteredBooks = useMemo(() => {
		let list = books;

		// filter by availability if checkbox checked
		if (onlyAvailable) list = list.filter((b) => b.available);

		// filter by search
		if (search.trim()) {
			const s = search.toLowerCase();
			list = list.filter((b) => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || (b.isbn && b.isbn.toLowerCase().includes(s)));
		}

		return list;
	}, [search, onlyAvailable, books]);

	return (
		<>
			<div className="space-y-8">
				<div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
					<label className="flex items-center space-x-2 text-sm text-gray-700">
						<input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
						<span>View Only Available</span>
					</label>
					<input type="text" placeholder="Search by title or author or isbn..." className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
					{filteredBooks.length === 0 ? (
						<div className="text-gray-500 italic col-span-full">No books found.</div>
					) : (
						filteredBooks.map((book) => (
							<div key={book.id} className="hover:scale-101 transition transform" onClick={() => setSelectedBook(book)}>
								<div className="cursor-pointer">
									<BookCard book={book} />
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Book Details Modal */}
			{selectedBook && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBook(null)}>
					<div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						<div className="p-6">
							<div className="flex justify-between items-start mb-4">
								<h2 className="text-2xl font-bold text-gray-900">Book Details</h2>
								<button onClick={() => setSelectedBook(null)} className="p-1 hover:bg-gray-100 rounded transition">
									<X className="w-6 h-6 text-gray-500" />
								</button>
							</div>

							<div className="flex flex-col md:flex-row gap-6">
								{/* Book Cover */}
								<div className="flex-shrink-0">
									{selectedBook.coverUrl ? (
										<img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-48 h-64 object-cover rounded-lg border shadow-lg" />
									) : (
										<div className="w-48 h-64 bg-gray-100 rounded-lg border flex items-center justify-center">
											<BookOpen className="w-16 h-16 text-gray-400" />
										</div>
									)}
								</div>

								{/* Book Info */}
								<div className="flex-1">
									<h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBook.title}</h3>
									<p className="text-gray-700 mb-4">
										by <span className="font-semibold">{selectedBook.author}</span>
									</p>

									<div className="space-y-3 mb-6">
										{selectedBook.isbn && (
											<div>
												<span className="text-sm font-medium text-gray-600">ISBN:</span>
												<span className="ml-2 text-sm text-gray-900">{selectedBook.isbn}</span>
											</div>
										)}
										<div>
											<span className="text-sm font-medium text-gray-600">Copies Available:</span>
											<span className="ml-2 text-sm text-gray-900">{selectedBook.copies}</span>
										</div>
										<div>
											<span className="text-sm font-medium text-gray-600">Status:</span>
											<span className={`ml-2 text-sm px-2 py-1 rounded-full ${selectedBook.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{selectedBook.available ? "Available" : "Not Available"}</span>
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex gap-3">
										{selectedBook.available ? (
											<Link href={`/books/borrow/${selectedBook.id}`} className="flex-1 text-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium">
												Borrow This Book
											</Link>
										) : (
											<button disabled className="flex-1 bg-gray-200 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed font-medium">
												Currently Unavailable
											</button>
										)}
										<button onClick={() => setSelectedBook(null)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
											Close
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
