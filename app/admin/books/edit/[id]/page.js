"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, BookOpen, User, Hash, Copy, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import PhotoUpload from "@/components/PhotoUpload";

export default function EditBookPage({ params }) {
	// Unwrap params with React.use() for Next.js 15+ dynamic route API
	const unwrappedParams = typeof params?.then === "function" ? React.use(params) : params;
	const bookId = unwrappedParams.id;

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		title: "",
		author: "",
		isbn: "",
		copies: 1,
		coverUrl: "",
		available: true
	});

	const router = useRouter();

	useEffect(() => {
		async function fetchBook() {
			try {
				setLoading(true);
				const res = await fetch(`/api/books?id=${bookId}`);
				if (!res.ok) throw new Error("Failed to fetch book details");

				const book = await res.json();
				if (book) {
					setFormData({
						title: book.title || "",
						author: book.author || "",
						isbn: book.isbn || "",
						copies: book.copies || 1,
						coverUrl: book.coverUrl || "",
						available: book.available
					});
				}
			} catch (err) {
				console.error(err);
				setError("Could not load book details. Please try again.");
			} finally {
				setLoading(false);
			}
		}
		if (bookId) {
			fetchBook();
		}
	}, [bookId]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === "checkbox" ? checked : value
		}));
	};

	const handleUpdate = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			const res = await fetch("/api/books", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: parseInt(bookId),
					...formData,
					copies: parseInt(formData.copies)
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update book");
			}

			router.push("/admin/books");
			router.refresh();
		} catch (err) {
			console.error(err);
			setError(err.message || "An error occurred while updating the book");
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6 md:p-12">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<button
							onClick={() => router.back()}
							className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-sm text-gray-600"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
						<div>
							<h1 className="text-3xl font-bold text-gray-900">Edit Book</h1>
							<p className="text-gray-500 mt-1">Update book details and availability</p>
						</div>
					</div>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
						<XCircle className="w-5 h-5 flex-shrink-0" />
						<p>{error}</p>
					</div>
				)}

				<form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* Left Column - Cover Image */}
						<div className="md:col-span-1">
							<label className="block text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<ImageIcon className="w-5 h-5 text-blue-600" />
								Cover Image
							</label>
							<div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
								<PhotoUpload
									photo={formData.coverUrl}
									setPhoto={(photo) => setFormData(prev => ({ ...prev, coverUrl: photo }))}
								/>
								<p className="text-xs text-gray-500 mt-3 text-center">
									Upload a book cover image. Max size 5MB.
								</p>
							</div>
						</div>

						{/* Right Column - Book Details */}
						<div className="md:col-span-2 space-y-6">
							<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
								<BookOpen className="w-5 h-5 text-blue-600" />
								Book Information
							</h2>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Book Title</label>
								<input
									type="text"
									name="title"
									value={formData.title}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="Enter book title"
									required
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<User className="h-5 w-5 text-gray-400" />
										</div>
										<input
											type="text"
											name="author"
											value={formData.author}
											onChange={handleChange}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
											placeholder="Author name"
											required
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Hash className="h-5 w-5 text-gray-400" />
										</div>
										<input
											type="text"
											name="isbn"
											value={formData.isbn}
											onChange={handleChange}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
											placeholder="ISBN number"
										/>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Total Copies</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Copy className="h-5 w-5 text-gray-400" />
										</div>
										<input
											type="number"
											name="copies"
											min="0"
											value={formData.copies}
											onChange={handleChange}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
											required
										/>
									</div>
								</div>
								<div className="flex items-end pb-1">
									<label className="flex items-center gap-3 cursor-pointer p-2.5 border border-gray-200 rounded-lg w-full hover:bg-gray-50 transition-colors">
										<div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.available ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
											{formData.available && <CheckCircle className="w-3.5 h-3.5 text-white" />}
										</div>
										<input
											type="checkbox"
											name="available"
											checked={formData.available}
											onChange={handleChange}
											className="hidden"
										/>
										<span className="text-sm font-medium text-gray-700">Available for Borrowing</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4">
						<button
							type="button"
							onClick={() => router.back()}
							className="px-6 py-2.5 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all shadow-md ${saving
									? "bg-blue-400 cursor-not-allowed"
									: "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
								}`}
						>
							{saving ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
									Saving...
								</>
							) : (
								<>
									<Save className="w-5 h-5" />
									Save Changes
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
