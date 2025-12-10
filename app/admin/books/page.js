"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ArrowLeft, BookOpen, User, Calendar, Edit, Trash2, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

export default function AdminBooksPage() {
	const [books, setBooks] = useState([]);
	const [selectedBook, setSelectedBook] = useState(null);
	const [bookTransactions, setBookTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editForm, setEditForm] = useState({ id: null, title: "", author: "", isbn: "", copies: 1, coverUrl: "" });

	const router = useRouter();
	const searchParams = useSearchParams();
	const bookId = searchParams.get("id");

	// Fetch books
	const fetchBooks = async () => {
		setLoading(true);
		const res = await fetch("/api/books");
		const data = await res.json();
		setBooks(data);
		setLoading(false);
	};

	const fetchBookDetails = async (id) => {
		setLoading(true);
		try {
			// Fetch book details
			const bookRes = await fetch(`/api/books?id=${id}`);
			const bookData = await bookRes.json();

			// Fetch book transactions
			const transRes = await fetch(`/api/transactions?bookId=${id}`);
			const transData = await transRes.json();

			setSelectedBook(bookData);
			setBookTransactions(transData);
		} catch (error) {
			console.error("Error fetching book details:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (bookId) {
			fetchBookDetails(bookId);
		} else {
			fetchBooks();
		}
	}, [bookId]);

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

		const response = await fetch("/api/books", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: editForm.id, ...payload }),
		});

		if (response.ok) {
			setShowEditModal(false);
			// If we're on a detail page, refresh the detail view
			if (bookId) {
				fetchBookDetails(bookId);
			} else {
				fetchBooks();
			}
		} else {
			const error = await response.json();
			alert(error.error || "Failed to update book");
		}
	};

	// Handle delete
	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this book?")) return;

		const response = await fetch("/api/books", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});

		if (response.ok) {
			// If we're on a detail page and deleting that book, redirect to list
			if (bookId && id.toString() === bookId) {
				router.push("/admin/books");
			} else {
				fetchBooks();
			}
		} else {
			const error = await response.json();
			alert(error.error || "Failed to delete book");
		}
	};

	return (
		<div className="p-6">
			{bookId && selectedBook ? (
				// Detailed Book View
				<BookDetailView book={selectedBook} transactions={bookTransactions} loading={loading} onBack={() => router.push("/admin/books")} onEdit={() => openEditModal(selectedBook)} onDelete={() => handleDelete(selectedBook.id)} />
			) : (
				// Books List View
				<>
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
				</>
			)}

			{/* Modal for Edit Book - Always available */}
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

// Book Detail View Component
function BookDetailView({ book, transactions, loading, onBack, onEdit, onDelete }) {
	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const activeTransactions = transactions.filter((t) => !t.returned);
	const completedTransactions = transactions.filter((t) => t.returned);
	const availableCopies = book.copies - activeTransactions.length;
	const overduebooks = activeTransactions.filter((t) => t.deadline && new Date(t.deadline) < new Date());

	return (
		<div className="max-w-6xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
						<ArrowLeft className="w-5 h-5" />
					</button>
					<h1 className="text-3xl font-bold text-gray-900">Book Details</h1>
				</div>
				<div className="flex gap-3">
					<button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
						<Edit className="w-4 h-4" />
						Edit Book
					</button>
					<button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
						<Trash2 className="w-4 h-4" />
						Delete Book
					</button>
				</div>
			</div>

			{/* Book Info Card */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div className="flex items-start gap-6">
					<div className="w-32 h-40 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">{book.coverUrl ? <Image src={book.coverUrl} alt={book.title} width={128} height={160} className="w-full h-full object-cover rounded" /> : <BookOpen className="w-16 h-16 text-gray-400" />}</div>
					<div className="flex-1">
						<div className="flex items-center gap-4 mb-4">
							<h2 className="text-2xl font-bold text-gray-900">{book.title}</h2>
							<span className={`px-3 py-1 rounded-full text-sm font-medium ${availableCopies > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{availableCopies > 0 ? "Available" : "Not Available"}</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">Author:</span>
								<span className="text-sm font-medium">{book.author}</span>
							</div>
							{book.isbn && (
								<div className="flex items-center gap-2">
									<BookOpen className="w-4 h-4 text-gray-500" />
									<span className="text-sm text-gray-600">ISBN:</span>
									<span className="font-mono text-sm">{book.isbn}</span>
								</div>
							)}
							<div className="flex items-center gap-2">
								<BookOpen className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">Copies:</span>
								<span className="text-sm">
									{availableCopies} of {book.copies} available
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
				<BookStatCard title="Total Copies" value={book.copies} icon={<BookOpen className="w-6 h-6" />} color="from-blue-400 to-blue-600" />
				<BookStatCard title="Available" value={availableCopies} icon={<CheckCircle className="w-6 h-6" />} color="from-green-400 to-green-600" />
				<BookStatCard title="Currently Issued" value={activeTransactions.length} icon={<User className="w-6 h-6" />} color="from-orange-400 to-orange-600" />
				<BookStatCard title="Overdue" value={overduebooks.length} icon={<AlertTriangle className="w-6 h-6" />} color="from-red-400 to-red-600" />
			</div>

			{/* Current Borrowings */}
			{activeTransactions.length > 0 && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<User className="w-5 h-5" />
						Currently Issued To
					</h3>
					<div className="space-y-4">
						{activeTransactions.map((transaction) => (
							<BookTransactionCard key={transaction.id} transaction={transaction} isActive={true} />
						))}
					</div>
				</div>
			)}

			{/* Transaction History */}
			{completedTransactions.length > 0 && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<Clock className="w-5 h-5" />
						Transaction History
					</h3>
					<div className="space-y-4">
						{completedTransactions.slice(0, 10).map((transaction) => (
							<BookTransactionCard key={transaction.id} transaction={transaction} isActive={false} />
						))}
						{completedTransactions.length > 10 && <div className="text-center text-gray-500 text-sm">And {completedTransactions.length - 10} more transactions...</div>}
					</div>
				</div>
			)}
		</div>
	);
}

// Book Statistics Card Component
function BookStatCard({ title, value, icon, color }) {
	return (
		<div className={`bg-gradient-to-r ${color} rounded-xl shadow p-6 text-white`}>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm opacity-80">{title}</p>
					<p className="text-2xl font-bold">{value}</p>
				</div>
				<div className="bg-white bg-opacity-20 rounded-full p-3">{icon}</div>
			</div>
		</div>
	);
}

// Book Transaction Card Component
function BookTransactionCard({ transaction, isActive }) {
	const isOverdue = isActive && transaction.deadline && new Date(transaction.deadline) < new Date();

	return (
		<div className={`border rounded-lg p-4 ${isOverdue ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<h4 className="font-medium text-gray-900">{transaction.User.name}</h4>
					<p className="text-sm text-gray-600">{transaction.User.email}</p>
					{transaction.User.membershipNumber && <p className="text-xs text-gray-500 font-mono">Member: {transaction.User.membershipNumber}</p>}
				</div>
				<div className="text-right">
					<div className="flex items-center gap-2 mb-1">
						{isActive ? (
							<span className="flex items-center gap-1 text-sm text-blue-600">
								<BookOpen className="w-4 h-4" />
								Currently Borrowed
							</span>
						) : (
							<span className="flex items-center gap-1 text-sm text-green-600">
								<CheckCircle className="w-4 h-4" />
								Returned
							</span>
						)}
					</div>
					<div className="text-xs text-gray-500">
						<div>Borrowed: {new Date(transaction.createdAt).toLocaleDateString()}</div>
						{transaction.deadline && <div className={isOverdue ? "text-red-600 font-medium" : ""}>Due: {new Date(transaction.deadline).toLocaleDateString()}</div>}
						{transaction.returnedAt && <div>Returned: {new Date(transaction.returnedAt).toLocaleDateString()}</div>}
						{transaction.fine > 0 && <div className="text-red-600 font-medium">Fine: ${(transaction.fine / 100).toFixed(2)}</div>}
					</div>
				</div>
			</div>
		</div>
	);
}
