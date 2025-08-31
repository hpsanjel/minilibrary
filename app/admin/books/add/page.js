// "use client";
// import { useState } from "react";

// export default function AddBookPage() {
// 	const [title, setTitle] = useState("");
// 	const [author, setAuthor] = useState("");
// 	const [isbn, setIsbn] = useState("");
// 	const [copies, setCopies] = useState(1);
// 	const [available, setAvailable] = useState(true);
// 	const [loading, setLoading] = useState(false);
// 	const [success, setSuccess] = useState("");
// 	const [error, setError] = useState("");

// 	async function handleSubmit(e) {
// 		e.preventDefault();
// 		setLoading(true);
// 		setSuccess("");
// 		setError("");
// 		const res = await fetch("/api/books/add", {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify({ title, author, isbn, copies, available }),
// 		});
// 		setLoading(false);
// 		if (res.ok) {
// 			setSuccess("Book added successfully!");
// 			setTitle("");
// 			setAuthor("");
// 			setIsbn("");
// 			setCopies(1);
// 			setAvailable(true);
// 		} else {
// 			const data = await res.json();
// 			setError(data.error || "Failed to add book");
// 		}
// 	}

// 	return (
// 		<div className="p-8 max-w-lg mx-auto">
// 			<h1 className="text-2xl font-bold mb-6">Add a New Book</h1>
// 			<form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
// 				{success && <div className="text-green-600 text-center">{success}</div>}
// 				{error && <div className="text-red-600 text-center">{error}</div>}
// 				<div>
// 					<label className="block mb-2 font-medium">Title</label>
// 					<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={title} onChange={(e) => setTitle(e.target.value)} required />
// 				</div>
// 				<div>
// 					<label className="block mb-2 font-medium">Author</label>
// 					<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={author} onChange={(e) => setAuthor(e.target.value)} required />
// 				</div>
// 				<div>
// 					<label className="block mb-2 font-medium">ISBN (optional)</label>
// 					<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="e.g. 9780451524935" />
// 				</div>
// 				<div>
// 					<label className="block mb-2 font-medium">Number of Copies</label>
// 					<input type="number" min={1} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={copies} onChange={(e) => setCopies(Number(e.target.value))} required />
// 				</div>
// 				<div className="flex items-center gap-2">
// 					<input type="checkbox" id="available" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
// 					<label htmlFor="available">Available</label>
// 				</div>
// 				<button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50" disabled={loading}>
// 					{loading ? "Adding..." : "Add Book"}
// 				</button>
// 			</form>
// 		</div>
// 	);
// }

"use client";
import { useState } from "react";

export default function AddBookPage() {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [isbn, setIsbn] = useState("");
	const [copies, setCopies] = useState(1);
	const [available, setAvailable] = useState(true);
	const [coverUrl, setCoverUrl] = useState(""); // new state for cover URL
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [error, setError] = useState("");

	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setSuccess("");
		setError("");

		const res = await fetch("/api/books/add", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title, author, isbn, copies, available, coverUrl }),
		});

		setLoading(false);

		if (res.ok) {
			setSuccess("Book added successfully!");
			setTitle("");
			setAuthor("");
			setIsbn("");
			setCopies(1);
			setAvailable(true);
			setCoverUrl(""); // reset cover URL
		} else {
			const data = await res.json();
			setError(data.error || "Failed to add book");
		}
	}

	return (
		<div className="p-8 max-w-lg mx-auto">
			<h1 className="text-2xl font-bold mb-6">Add a New Book</h1>
			<form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
				{success && <div className="text-green-600 text-center">{success}</div>}
				{error && <div className="text-red-600 text-center">{error}</div>}

				<div>
					<label className="block mb-2 font-medium">Title</label>
					<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={title} onChange={(e) => setTitle(e.target.value)} required />
				</div>

				<div>
					<label className="block mb-2 font-medium">Author</label>
					<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={author} onChange={(e) => setAuthor(e.target.value)} required />
				</div>

				<div>
					<label className="block mb-2 font-medium">ISBN (optional)</label>
					<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="e.g. 9780451524935" />
				</div>

				<div>
					<label className="block mb-2 font-medium">Cover Image URL (optional)</label>
					<input type="url" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://example.com/cover.jpg" />
				</div>

				<div>
					<label className="block mb-2 font-medium">Number of Copies</label>
					<input type="number" min={1} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={copies} onChange={(e) => setCopies(Number(e.target.value))} required />
				</div>

				<div className="flex items-center gap-2">
					<input type="checkbox" id="available" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
					<label htmlFor="available">Available</label>
				</div>

				<button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50" disabled={loading}>
					{loading ? "Adding..." : "Add Book"}
				</button>
			</form>
		</div>
	);
}
