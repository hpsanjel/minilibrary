"use client";
import { useEffect, useState, useRef } from "react";

export default function AdminIssuePage() {
	const [users, setUsers] = useState([]);
	const [books, setBooks] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [selectedBook, setSelectedBook] = useState(null);
	const [userQuery, setUserQuery] = useState("");
	const [bookQuery, setBookQuery] = useState("");
	const userInputRef = useRef();
	const bookInputRef = useRef();
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetch("/api/users")
			.then((res) => res.json())
			.then((data) => setUsers(data));
		fetch("/api/books")
			.then((res) => res.json())
			.then((data) => {
				// Filter books that have available copies
				const availableBooks = data.filter((b) => {
					// Extract available count from "X of Y available" format
					const match = b.availableCopies?.match(/^(\d+) of \d+ available$/);
					const availableCount = match ? parseInt(match[1]) : 0;
					return availableCount > 0;
				});
				setBooks(availableBooks);
			});
	}, []);

	const filteredUsers = users.filter((u) => (u.name && u.name.toLowerCase().includes(userQuery.toLowerCase())) || (u.email && u.email.toLowerCase().includes(userQuery.toLowerCase())));
	const filteredBooks = books.filter((b) => (b.title && b.title.toLowerCase().includes(bookQuery.toLowerCase())) || (b.author && b.author.toLowerCase().includes(bookQuery.toLowerCase())));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		const res = await fetch("/api/transactions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: selectedUser?.id, bookId: selectedBook?.id }),
		});
		const data = await res.json();
		if (res.ok) {
			setMessage("Book issued successfully!");
			setSelectedUser(null);
			setSelectedBook(null);
			setUserQuery("");
			setBookQuery("");
			userInputRef.current && userInputRef.current.focus();
		} else {
			setMessage(data.error || "Failed to issue book.");
		}
		setLoading(false);
	};

	return (
		<div className="max-w-xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Issue Book to User</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded shadow">
				{/* User Combobox */}
				<div>
					<label className="block mb-1 font-medium">User</label>
					<input
						ref={userInputRef}
						type="text"
						placeholder="Search user by name or email"
						value={userQuery}
						onChange={(e) => {
							setUserQuery(e.target.value);
							setSelectedUser(null);
						}}
						className="border p-2 rounded w-full mb-2"
						autoComplete="off"
					/>
					{userQuery && filteredUsers.length > 0 && (
						<ul className="border rounded bg-white max-h-40 overflow-y-auto shadow mt-1">
							{filteredUsers.map((u) => (
								<li
									key={u.id}
									className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${selectedUser?.id === u.id ? "bg-blue-50" : ""}`}
									onClick={() => {
										setSelectedUser(u);
										setUserQuery(u.name ? `${u.name} (${u.email})` : u.email);
									}}
								>
									<div className="font-medium">
										{u.name || u.email} <span className="text-xs text-gray-500">({u.email})</span>
									</div>
									<div className="text-xs text-gray-500">
										Role: {u.role} | Verified: {u.verifiedUser}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
				{/* Book Combobox */}
				<div>
					<label className="block mb-1 font-medium">Book</label>
					<input
						ref={bookInputRef}
						type="text"
						placeholder="Search book by title or author"
						value={bookQuery}
						onChange={(e) => {
							setBookQuery(e.target.value);
							setSelectedBook(null);
						}}
						className="border p-2 rounded w-full mb-2"
						autoComplete="off"
					/>
					{bookQuery && filteredBooks.length > 0 && (
						<ul className="border rounded bg-white max-h-40 overflow-y-auto shadow mt-1">
							{filteredBooks.map((b) => (
								<li
									key={b.id}
									className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${selectedBook?.id === b.id ? "bg-blue-50" : ""}`}
									onClick={() => {
										setSelectedBook(b);
										setBookQuery(`${b.title} by ${b.author}`);
									}}
								>
									<div className="font-medium">
										{b.title} <span className="text-xs text-gray-500">by {b.author}</span>
									</div>
									<div className="text-xs text-gray-500">{b.availableCopies}</div>
								</li>
							))}
						</ul>
					)}
				</div>
				<button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow" disabled={loading || !selectedUser || !selectedBook}>
					{loading ? "Issuing..." : "Issue Book"}
				</button>
				{message && (
					<div className="text-center text-sm mt-2 bg-green-100 border border-green-300 text-green-700 rounded p-2 relative">
						{message}
						<button type="button" className="absolute right-2 top-2 text-green-700" onClick={() => setMessage("")}>
							×
						</button>
					</div>
				)}
			</form>
		</div>
	);
}
