"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function EditBookPage({ params }) {
	// Unwrap params with React.use() for Next.js 15+ dynamic route API
	const unwrappedParams = typeof params?.then === "function" ? React.use(params) : params;

	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [isbn, setIsbn] = useState("");
	const [copies, setCopies] = useState(1);
	const [available, setAvailable] = useState(true);
	const router = useRouter();

	useEffect(() => {
		async function fetchBook() {
			const res = await fetch(`/api/books`);
			const data = await res.json();
			const book = data.find((b) => b.id === parseInt(unwrappedParams.id));
			if (book) {
				setTitle(book.title);
				setAuthor(book.author);
				setIsbn(book.isbn || "");
				setCopies(book.copies || 1);
				setAvailable(book.available);
			}
		}
		fetchBook();
	}, [unwrappedParams.id]);

	const handleUpdate = async (e) => {
		e.preventDefault();
		await fetch("/api/books", {
			method: "PATCH",
			body: JSON.stringify({ id: parseInt(unwrappedParams.id), title, author, isbn, copies, available }),
		});
		router.push("/admin/books");
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Edit Book</h1>
			<form onSubmit={handleUpdate} className="flex flex-col gap-3 max-w-sm">
				<input value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 rounded" required />
				<input value={author} onChange={(e) => setAuthor(e.target.value)} className="border p-2 rounded" required />
				<input value={isbn} onChange={(e) => setIsbn(e.target.value)} className="border p-2 rounded" placeholder="ISBN (optional)" />
				<input type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} className="border p-2 rounded" required placeholder="Copies" />
				<label className="flex items-center gap-2">
					<input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
					Available
				</label>
				<button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
					Update
				</button>
			</form>
		</div>
	);
}
