"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, User, Phone, Mail, CreditCard, Clock, DollarSign, CheckCircle, XCircle, ArrowLeft, Search, Users, Library } from "lucide-react";

export default function SearchResultsPage() {
	const [results, setResults] = useState({ users: [], books: [], query: "" });
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get("q");

	useEffect(() => {
		if (query) {
			fetchSearchResults(query);
		}
	}, [query]);

	const fetchSearchResults = async (searchQuery) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
			const data = await response.json();
			setResults(data);
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString();
	};

	const filteredResults = () => {
		switch (activeTab) {
			case "users":
				return { users: results.users, books: [] };
			case "books":
				return { users: [], books: results.books };
			default:
				return results;
		}
	};

	const currentResults = filteredResults();
	const totalResults = results.users.length + results.books.length;

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 p-4">
				<div className="max-w-6xl mx-auto">
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
								<ArrowLeft className="w-5 h-5" />
							</button>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
								<p className="text-gray-600 mt-1">
									{totalResults} results for "{query}"
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Search className="w-4 h-4" />
							<span>Admin Search</span>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex gap-1 mt-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
						<button onClick={() => setActiveTab("all")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
							All ({totalResults})
						</button>
						<button onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === "users" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
							<Users className="w-4 h-4 inline mr-1" />
							Users ({results.users.length})
						</button>
						<button onClick={() => setActiveTab("books")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === "books" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
							<Library className="w-4 h-4 inline mr-1" />
							Books ({results.books.length})
						</button>
					</div>
				</div>

				{/* Results */}
				{totalResults === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-12 text-center">
						<Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
						<p className="text-gray-600">Try searching with different keywords or check your spelling.</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Users Results */}
						{currentResults.users.length > 0 && (
							<div>
								{activeTab === "all" && (
									<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
										<Users className="w-5 h-5" />
										Users ({results.users.length})
									</h2>
								)}
								<div className="grid gap-6">
									{currentResults.users.map((user) => (
										<UserCard key={user.id} user={user} />
									))}
								</div>
							</div>
						)}

						{/* Books Results */}
						{currentResults.books.length > 0 && (
							<div>
								{activeTab === "all" && currentResults.users.length > 0 && <hr className="my-8" />}
								{activeTab === "all" && (
									<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
										<Library className="w-5 h-5" />
										Books ({results.books.length})
									</h2>
								)}
								<div className="grid gap-6">
									{currentResults.books.map((book) => (
										<BookCard key={book.id} book={book} />
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function UserCard({ user }) {
	const router = useRouter();

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
			<div className="p-6">
				{/* User Header */}
				<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
					<div className="flex items-start gap-4">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
							<User className="w-6 h-6 text-blue-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
							<div className="space-y-1 mt-2">
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<Mail className="w-4 h-4 flex-shrink-0" />
									<span className="truncate">{user.email}</span>
								</div>
								{user.phone && (
									<div className="flex items-center gap-2 text-sm text-gray-600">
										<Phone className="w-4 h-4 flex-shrink-0" />
										<span>{user.phone}</span>
									</div>
								)}
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<CreditCard className="w-4 h-4 flex-shrink-0" />
									<span className="font-mono">{user.membershipNumber || "N/A"}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="flex gap-4 sm:gap-6">
						<div className="text-center">
							<div className="text-lg font-semibold text-gray-900">{user.currentlyBorrowedBooks}</div>
							<div className="text-xs text-gray-500">Currently Borrowed</div>
						</div>
						<div className="text-center">
							<div className="text-lg font-semibold text-gray-900">{user.totalBorrowed}</div>
							<div className="text-xs text-gray-500">Total Borrowed</div>
						</div>
						<div className="text-center">
							<div className={`text-lg font-semibold ${user.totalFines > 0 ? "text-red-600" : "text-green-600"}`}>${user.totalFines.toFixed(2)}</div>
							<div className="text-xs text-gray-500">Fines</div>
						</div>
					</div>
				</div>

				{/* Active Transactions */}
				{user.activeTransactions.length > 0 && (
					<div className="border-t pt-4">
						<h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
							<BookOpen className="w-4 h-4" />
							Currently Borrowed Books
						</h4>
						<div className="space-y-2">
							{user.activeTransactions.slice(0, 3).map((transaction) => (
								<div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div className="flex-1 min-w-0">
										<div className="font-medium text-gray-900 truncate">{transaction.book.title}</div>
										<div className="text-sm text-gray-600">by {transaction.book.author}</div>
									</div>
									<div className="text-right">
										<div className="text-sm text-gray-600">Issued: {new Date(transaction.createdAt).toLocaleDateString()}</div>
										{transaction.deadline && <div className={`text-sm ${new Date(transaction.deadline) < new Date() ? "text-red-600 font-medium" : "text-gray-600"}`}>Due: {new Date(transaction.deadline).toLocaleDateString()}</div>}
									</div>
								</div>
							))}
							{user.activeTransactions.length > 3 && <div className="text-sm text-gray-500 text-center py-2">And {user.activeTransactions.length - 3} more...</div>}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
					<button onClick={() => router.push(`/admin/users?id=${user.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
						View Details
					</button>
					<button onClick={() => router.push(`/admin/issue?userId=${user.id}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
						Issue Book
					</button>
					{user.currentlyBorrowedBooks > 0 && (
						<button onClick={() => router.push(`/admin/returns?userId=${user.id}`)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
							Return Book
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

function BookCard({ book }) {
	const router = useRouter();

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
			<div className="p-6">
				{/* Book Header */}
				<div className="flex flex-col sm:flex-row gap-4 mb-4">
					<div className="w-16 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">{book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover rounded" /> : <BookOpen className="w-8 h-8 text-gray-400" />}</div>

					<div className="flex-1 min-w-0">
						<h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
						<p className="text-gray-600 mb-2">by {book.author}</p>

						<div className="flex flex-wrap gap-4 text-sm">
							<div className="flex items-center gap-1">
								<span className="text-gray-500">ISBN:</span>
								<span className="font-mono text-gray-900">{book.isbn}</span>
							</div>
							<div className="flex items-center gap-2">
								{book.isAvailable ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
								<span className={book.isAvailable ? "text-green-600" : "text-red-600"}>
									{book.availableCopies} of {book.totalCopies} available
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Currently Borrowed By */}
				{book.borrowedBy.length > 0 && (
					<div className="border-t pt-4">
						<h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
							<User className="w-4 h-4" />
							Currently Borrowed By
						</h4>
						<div className="space-y-2">
							{book.borrowedBy.map((user, index) => {
								const transaction = book.activeTransactions.find((trans) => trans.user.id === user.id);
								return (
									<div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div className="flex-1 min-w-0">
											<div className="font-medium text-gray-900">{user.name}</div>
											<div className="text-sm text-gray-600">
												{user.email} • {user.membershipNumber || "N/A"}
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-gray-600">Issued: {new Date(transaction.createdAt).toLocaleDateString()}</div>
											{transaction.deadline && <div className={`text-sm ${new Date(transaction.deadline) < new Date() ? "text-red-600 font-medium" : "text-gray-600"}`}>Due: {new Date(transaction.deadline).toLocaleDateString()}</div>}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
					<button onClick={() => router.push(`/admin/books?id=${book.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
						View Details
					</button>
					{book.isAvailable && (
						<button onClick={() => router.push(`/admin/issue?bookId=${book.id}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
							Issue Book
						</button>
					)}
					<button onClick={() => router.push(`/admin/books/edit/${book.id}`)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
						Edit Book
					</button>
				</div>
			</div>
		</div>
	);
}
