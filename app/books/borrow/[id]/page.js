"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { redirect } from "next/navigation";
import Image from "next/image";

export default function BorrowBookPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const params = useParams();
	const [book, setBook] = useState(null);
	const [user, setUser] = useState(null);
	const [userTransactions, setUserTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [borrowing, setBorrowing] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const bookId = parseInt(params.id);

	// Redirect to sign-in if not authenticated
	useEffect(() => {
		if (status === "loading") return; // Still loading session

		if (!session) {
			router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(`/books/borrow/${params.id}`)}`);
			return;
		}

		// Fetch book and user data
		const fetchData = async () => {
			try {
				setLoading(true);

				// Fetch book details
				const bookRes = await fetch(`/api/books?id=${bookId}`);
				const bookData = await bookRes.json();

				if (!bookRes.ok || !bookData) {
					setError("Book not found.");
					setLoading(false);
					return;
				}

				if (!bookData.available || bookData.copies < 1) {
					setError("Book is not available.");
					setLoading(false);
					return;
				}

				setBook(bookData);

				// Fetch user details
				const userRes = await fetch(`/api/users?id=${session.user.id}`);
				const userData = await userRes.json();
				setUser(userData);

				// Fetch user's current transactions
				const transactionsRes = await fetch(`/api/transactions?userId=${session.user.id}`);
				const transactionsData = await transactionsRes.json();
				setUserTransactions(transactionsData.filter((t) => !t.returned));
			} catch (error) {
				console.error("Error fetching data:", error);
				setError("Failed to load data.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [session, status, params.id, router, bookId]);

	const handleBorrow = async () => {
		setBorrowing(true);
		setError("");

		try {
			const response = await fetch("/api/issues", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: session.user.id,
					bookId: bookId,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				setSuccess(true);
			} else {
				setError(result.error || "Failed to borrow book. Please try again.");
			}
		} catch (error) {
			console.error("Error borrowing book:", error);
			setError("Failed to borrow book. Please try again.");
		}

		setBorrowing(false);
	};

	if (status === "loading" || loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
				<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
					<h2 className="text-xl font-bold mb-4 text-red-600">Cannot Borrow Book</h2>
					<p className="mb-4">{error}</p>
					<button onClick={() => router.push("/books")} className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
						Go Back to Books
					</button>
				</div>
			</div>
		);
	}

	if (success) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
				<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
					<h2 className="text-xl font-bold mb-4 text-green-600">Borrowing Complete</h2>
					<p className="mb-4">
						You have successfully borrowed &ldquo;{book?.title}&rdquo;.
						<br />
						Please return it within 30 days.
					</p>
					<button onClick={() => router.push("/books")} className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
						Go to Books
					</button>
				</div>
			</div>
		);
	}

	if (!book || !user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-2xl mx-auto px-4">
				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					{/* Header */}
					<div className="bg-blue-600 text-white p-6">
						<h1 className="text-2xl font-bold">Confirm Book Borrowing</h1>
						<p className="text-blue-100 mt-1">Please review the details before proceeding</p>
					</div>

					{/* Book Details */}
					<div className="p-6">
						<div className="flex gap-6 mb-6">
							<div className="w-24 h-32 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
								{book.coverUrl ? (
									<Image src={book.coverUrl} alt={book.title} width={96} height={128} className="w-full h-full object-cover rounded" />
								) : (
									<div className="text-gray-400 text-center">
										<div className="text-xs">No Cover</div>
									</div>
								)}
							</div>
							<div className="flex-1">
								<h2 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h2>
								<p className="text-gray-600 mb-2">by {book.author}</p>
								{book.isbn && <p className="text-sm text-gray-500 mb-2">ISBN: {book.isbn}</p>}
								<div className="flex items-center gap-4">
									<span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Available</span>
									<span className="text-sm text-gray-600">{book.availableCopies} available</span>
								</div>
							</div>
						</div>

						{/* Borrowing Details */}
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<h3 className="font-semibold text-gray-900 mb-3">Borrowing Details</h3>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Borrower:</span>
									<span className="font-medium">{user.name}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Borrow Date:</span>
									<span className="font-medium">{new Date().toLocaleDateString()}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Return Due:</span>
									<span className="font-medium text-blue-600">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Late Fee:</span>
									<span className="font-medium">$0.50/day after due date</span>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4">
							<button onClick={() => router.push("/books")} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" disabled={borrowing}>
								Cancel
							</button>
							<button onClick={handleBorrow} disabled={borrowing} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
								{borrowing ? "Processing..." : "Confirm Borrow"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
