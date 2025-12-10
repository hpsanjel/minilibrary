"use client";
import { useState } from "react";
import { Upload, Plus, Download } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

export default function AddBookPage() {
	const [activeTab, setActiveTab] = useState("single"); // "single" or "csv"
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [isbn, setIsbn] = useState("");
	const [copies, setCopies] = useState(1);
	const [available, setAvailable] = useState(true);
	const [coverImage, setCoverImage] = useState("");
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
			body: JSON.stringify({ title, author, isbn, copies, available, coverImage }),
		});

		setLoading(false);

		if (res.ok) {
			setSuccess("Book added successfully!");
			setTitle("");
			setAuthor("");
			setIsbn("");
			setCopies(1);
			setAvailable(true);
			setCoverImage("");
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
		const csvContent = `title,author,isbn,copies,imageFileName
"The Great Gatsby","F. Scott Fitzgerald","9780743273565",3,"gatsby.jpg"
"To Kill a Mockingbird","Harper Lee","9780061120084",2,"mockingbird.jpg"
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
			<h1 className="text-2xl font-bold mb-8 text-center">Add New Books</h1>

			{/* Tabs */}
			<div className="flex justify-center space-x-4 mb-8">
				<button onClick={() => setActiveTab("single")} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${activeTab === "single" ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}>
					<Plus className="w-4 h-4" />
					Single Book
				</button>
				<button onClick={() => setActiveTab("csv")} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${activeTab === "csv" ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}>
					<Upload className="w-4 h-4" />
					ZIP Upload
				</button>
			</div>

			{/* Single Book Form */}
			{activeTab === "single" && (
				<div className="flex justify-center">
					<div className="w-full max-w-lg">
						<form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
							{success && <div className="text-green-600 text-center bg-green-50 p-4 rounded-lg border border-green-200">{success}</div>}
							{error && <div className="text-red-600 text-center bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>}
							<div>
								<label className="block mb-3 font-semibold text-gray-700">Title</label>
								<input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={title} onChange={(e) => setTitle(e.target.value)} required />
							</div>
							<div>
								<label className="block mb-3 font-semibold text-gray-700">Author</label>
								<input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={author} onChange={(e) => setAuthor(e.target.value)} required />
							</div>
							<div>
								<label className="block mb-3 font-semibold text-gray-700">ISBN (optional)</label>
								<input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="e.g. 9780451524935" />
							</div>
							<ImageUpload image={coverImage} setImage={setCoverImage} label="Cover Image" optional={true} />
							<div>
								<label className="block mb-3 font-semibold text-gray-700">Number of Copies</label>
								<input type="number" min={1} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={copies} onChange={(e) => setCopies(Number(e.target.value))} required />
							</div>
							<div className="flex items-center gap-3">
								<input type="checkbox" id="available" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
								<label htmlFor="available" className="font-medium text-gray-700">
									Available
								</label>
							</div>{" "}
							<button type="submit" className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
								{loading ? "Adding..." : "Add Book"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* CSV Upload Form */}
			{activeTab === "csv" && (
				<div className="flex justify-center">
					<div className="w-full max-w-2xl">
						<div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
							{/* Instructions */}
							<div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
								<h3 className="font-semibold text-blue-900 mb-3">ZIP Upload Instructions</h3>
								<ul className="text-sm text-blue-700 space-y-2">
									<li>• Create a folder with your CSV file and book cover images</li>
									<li>• CSV must include columns: title, author, isbn, copies, imageFileName</li>
									<li>• Title and author are required fields</li>
									<li>• imageFileName should match the image file names in the ZIP (e.g., &quot;gatsby.jpg&quot;)</li>
									<li>• Leave imageFileName empty if no cover image for that book</li>
									<li>• ZIP the folder and upload it below</li>
								</ul>
								<button onClick={downloadSampleCsv} className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors">
									<Download className="w-4 h-4" />
									Download Sample CSV
								</button>
							</div>

							{/* Upload Form */}
							<form onSubmit={handleCsvUpload} className="space-y-6">
								{csvSuccess && <div className="text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">{csvSuccess}</div>}
								{csvError && <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{csvError}</div>}
								<div>
									<label className="block mb-3 font-semibold text-gray-700">Select ZIP File</label>
									<input id="csvFile" type="file" accept=".zip" onChange={(e) => setCsvFile(e.target.files[0])} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" required />
								</div>{" "}
								<button type="submit" className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
									{csvLoading ? "Uploading..." : "Upload CSV"}
								</button>
							</form>

							{/* Upload Results */}
							{uploadResults && (
								<div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
									<h3 className="font-semibold mb-4">Upload Results</h3>
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div className="text-green-600 font-medium">✅ Successful: {uploadResults.successful}</div>
										<div className="text-red-600 font-medium">❌ Failed: {uploadResults.failed}</div>
									</div>

									{uploadResults.errors && uploadResults.errors.length > 0 && (
										<div className="mt-6">
											<h4 className="font-semibold text-red-600 mb-3">Errors:</h4>
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
				</div>
			)}
		</div>
	);
}
