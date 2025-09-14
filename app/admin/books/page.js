"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function AdminBooksPage() {
	const [books, setBooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editForm, setEditForm] = useState({ id: null, title: "", author: "", isbn: "", copies: 1, coverUrl: "" });
	const router = useRouter();

	// Fetch books
	const fetchBooks = async () => {
		setLoading(true);
		const res = await fetch("/api/books");
		const data = await res.json();
		setBooks(data);
		setLoading(false);
	};

	useEffect(() => {
		fetchBooks();
	}, []);

	// Handle edit modal open
	const openEditModal = (book) => {
		setEditForm({
			...book,
			isbn: book.isbn || "",
			copies: book.copies || 1,
			coverUrl: book.coverUrl || "",
		});
		setShowEditModal(true);
	};

	// Handle form submit for editing
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		const payload = {
			title: editForm.title,
			author: editForm.author,
			isbn: editForm.isbn,
			copies: editForm.copies,
			coverUrl: editForm.coverUrl,
		};

		await fetch("/api/books", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: editForm.id, ...payload }),
		});

		setShowEditModal(false);
		fetchBooks();
	};

	// Handle delete
	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this book?")) return;
		await fetch("/api/books", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		fetchBooks();
	};

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Books</h1>
				<button onClick={() => router.push("/admin/books/add")} className="flex text-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition cursor-pointer">
					<Plus className="w-4 h-4" />
					Add Books
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg shadow border bg-white">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cover</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copies</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{loading ? (
							<tr>
								<td colSpan={8} className="text-center py-8 text-gray-400">
									Loading...
								</td>
							</tr>
						) : books.length === 0 ? (
							<tr>
								<td colSpan={8} className="text-center py-8 text-gray-400">
									No books found.
								</td>
							</tr>
						) : (
							books.map((book) => (
								<tr key={book.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm">{book.coverUrl ? <Image src={book.coverUrl} alt={book.title} width={48} height={64} className="w-12 h-16 object-cover rounded" /> : <div className="w-12 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded">No Cover</div>}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{book.title}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{book.author}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{book.isbn || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{book.copies}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span className={`px-2 py-1 rounded text-xs font-medium ${book.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{book.available ? "Available" : "Borrowed"}</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<div className="flex items-center justify-center gap-2">
											<button onClick={() => openEditModal(book)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow text-xs">
												Edit
											</button>
											<button onClick={() => handleDelete(book.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-xs">
												Delete
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Modal for Edit Book */}
			{showEditModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
					<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
						<h2 className="text-xl font-bold mb-4">Edit Book</h2>
						<form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
							<input type="text" placeholder="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="border p-2 rounded" required />
							<input type="text" placeholder="Author" value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} className="border p-2 rounded" required />
							<input type="text" placeholder="ISBN (optional)" value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} className="border p-2 rounded" />
							<input type="url" placeholder="Cover Image URL (optional)" value={editForm.coverUrl} onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })} className="border p-2 rounded" />
							<input type="number" min={1} placeholder="Copies" value={editForm.copies} onChange={(e) => setEditForm({ ...editForm, copies: Number(e.target.value) })} className="border p-2 rounded" required />

							<div className="flex gap-2 mt-4">
								<button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
									Update
								</button>
								<button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded shadow">
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
