"use client";
import { useState } from "react";
import { Upload, Plus, Download } from "lucide-react";

export default function AddBookPage() {
	const [activeTab, setActiveTab] = useState("single"); // "single" or "csv"
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [isbn, setIsbn] = useState("");
	const [copies, setCopies] = useState(1);
	const [available, setAvailable] = useState(true);
	const [coverUrl, setCoverUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [error, setError] = useState("");

	// CSV upload states
	const [csvFile, setCsvFile] = useState(null);
	const [csvLoading, setCsvLoading] = useState(false);
	const [csvSuccess, setCsvSuccess] = useState("");
	const [csvError, setCsvError] = useState("");
	const [uploadResults, setUploadResults] = useState(null);

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
			setCoverUrl("");
		} else {
			const data = await res.json();
			setError(data.error || "Failed to add book");
		}
	}

	async function handleCsvUpload(e) {
		e.preventDefault();
		if (!csvFile) {
			setCsvError("Please select a CSV file");
			return;
		}

		setCsvLoading(true);
		setCsvSuccess("");
		setCsvError("");
		setUploadResults(null);

		const formData = new FormData();
		formData.append("csvFile", csvFile);

		try {
			const res = await fetch("/api/books/bulk-upload", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();

			if (res.ok) {
				setCsvSuccess(`Successfully uploaded ${data.successful} books!`);
				setUploadResults(data);
				setCsvFile(null);
				// Reset file input
				const fileInput = document.getElementById("csvFile");
				if (fileInput) fileInput.value = "";
			} else {
				setCsvError(data.error || "Failed to upload CSV");
				if (data.results) setUploadResults(data);
			}
		} catch (error) {
			setCsvError("Error uploading file");
		}

		setCsvLoading(false);
	}

	function downloadSampleCsv() {
		const csvContent = `title,author,isbn,copies,coverUrl
"The Great Gatsby","F. Scott Fitzgerald","9780743273565",3,"https://example.com/gatsby.jpg"
"To Kill a Mockingbird","Harper Lee","9780061120084",2,"https://example.com/mockingbird.jpg"
"1984","George Orwell","9780451524935",4,""`;

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "books_sample.csv";
		a.click();
		window.URL.revokeObjectURL(url);
	}

	return (
		<div className="p-8 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Add New Books</h1>

			{/* Tabs */}
			<div className="flex space-x-4 mb-6">
				<button onClick={() => setActiveTab("single")} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === "single" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
					<Plus className="w-4 h-4" />
					Single Book
				</button>
				<button onClick={() => setActiveTab("csv")} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === "csv" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
					<Upload className="w-4 h-4" />
					CSV Upload
				</button>
			</div>

			{/* Single Book Form */}
			{activeTab === "single" && (
				<div className="max-w-lg mx-auto">
					<form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
						{success && <div className="text-green-600 text-center bg-green-50 p-3 rounded">{success}</div>}
						{error && <div className="text-red-600 text-center bg-red-50 p-3 rounded">{error}</div>}

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
			)}

			{/* CSV Upload Form */}
			{activeTab === "csv" && (
				<div className="max-w-2xl mx-auto">
					<div className="bg-white p-6 rounded-xl shadow">
						{/* Instructions */}
						<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h3 className="font-medium text-blue-900 mb-2">CSV Upload Instructions</h3>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• CSV must include columns: title, author, isbn, copies, coverUrl</li>
								<li>• Title and author are required fields</li>
								<li>• ISBN and coverUrl are optional (can be empty)</li>
								<li>• Copies should be a positive number (defaults to 1)</li>
								<li>• Use quotes for text fields that contain commas</li>
							</ul>
							<button onClick={downloadSampleCsv} className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800">
								<Download className="w-4 h-4" />
								Download Sample CSV
							</button>
						</div>

						{/* Upload Form */}
						<form onSubmit={handleCsvUpload} className="space-y-6">
							{csvSuccess && <div className="text-green-600 bg-green-50 p-3 rounded">{csvSuccess}</div>}
							{csvError && <div className="text-red-600 bg-red-50 p-3 rounded">{csvError}</div>}

							<div>
								<label className="block mb-2 font-medium">Select CSV File</label>
								<input id="csvFile" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
							</div>

							<button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition disabled:opacity-50" disabled={csvLoading}>
								{csvLoading ? "Uploading..." : "Upload CSV"}
							</button>
						</form>

						{/* Upload Results */}
						{uploadResults && (
							<div className="mt-6 p-4 bg-gray-50 rounded-lg">
								<h3 className="font-medium mb-3">Upload Results</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div className="text-green-600">✅ Successful: {uploadResults.successful}</div>
									<div className="text-red-600">❌ Failed: {uploadResults.failed}</div>
								</div>

								{uploadResults.errors && uploadResults.errors.length > 0 && (
									<div className="mt-4">
										<h4 className="font-medium text-red-600 mb-2">Errors:</h4>
										<ul className="text-sm text-red-600 space-y-1">
											{uploadResults.errors.map((error, index) => (
												<li key={index}>
													Row {error.row}: {error.error}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
