"use client";
import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

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

	// QR Scanner states
	const [showUserScanner, setShowUserScanner] = useState(false);
	const [showBookScanner, setShowBookScanner] = useState(false);
	const userScannerRef = useRef(null);
	const bookScannerRef = useRef(null);

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

	// Cleanup scanners on unmount
	useEffect(() => {
		return () => {
			if (userScannerRef.current) {
				userScannerRef.current.clear().catch(console.error);
			}
			if (bookScannerRef.current) {
				bookScannerRef.current.clear().catch(console.error);
			}
		};
	}, []);

	const filteredUsers = users.filter((u) => (u.name && u.name.toLowerCase().includes(userQuery.toLowerCase())) || (u.email && u.email.toLowerCase().includes(userQuery.toLowerCase())) || (u.membershipNumber && u.membershipNumber.toLowerCase().includes(userQuery.toLowerCase())));
	const filteredBooks = books.filter((b) => (b.title && b.title.toLowerCase().includes(bookQuery.toLowerCase())) || (b.author && b.author.toLowerCase().includes(bookQuery.toLowerCase())) || (b.isbn && b.isbn.toLowerCase().includes(bookQuery.toLowerCase())));

	// QR Scanner Functions
	const startUserScanner = () => {
		console.log("Starting user scanner...");
		setShowUserScanner(true);
		setTimeout(() => {
			console.log("Initializing user scanner DOM element...");
			try {
				const scanner = new Html5QrcodeScanner(
					"user-qr-scanner",
					{
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1.0,
						showTorchButtonIfSupported: true,
						showZoomSliderIfSupported: true,
						defaultZoomValueIfSupported: 2,
						experimentalFeatures: {
							useBarCodeDetectorIfSupported: true,
						},
					},
					/* verbose= */ false
				);

				scanner.render(
					(decodedText) => {
						// Handle successful scan
						console.log("User QR scanned:", decodedText);
						setUserQuery(decodedText);
						setSelectedUser(null);
						scanner
							.clear()
							.then(() => {
								setShowUserScanner(false);
								// Auto-focus to book input after successful scan
								setTimeout(() => {
									if (bookInputRef.current) {
										bookInputRef.current.focus();
									}
								}, 100);
							})
							.catch((err) => {
								console.error("Error clearing user scanner:", err);
								setShowUserScanner(false);
							});
					},
					(error) => {
						// Handle scan error (usually just no QR code detected)
						if (error && !error.includes("No MultiFormat Readers") && !error.includes("NotFoundException")) {
							console.log("QR scan error:", error);
						}
					}
				);

				userScannerRef.current = scanner;
			} catch (error) {
				console.error("Failed to start user scanner:", error);
				alert("Failed to start camera. Please check camera permissions and try again.");
				setShowUserScanner(false);
			}
		}, 300);
	};

	const startBookScanner = () => {
		console.log("Starting book scanner...");
		setShowBookScanner(true);
		setTimeout(() => {
			console.log("Initializing book scanner DOM element...");
			try {
				const scanner = new Html5QrcodeScanner(
					"book-qr-scanner",
					{
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1.0,
						showTorchButtonIfSupported: true,
						showZoomSliderIfSupported: true,
						defaultZoomValueIfSupported: 2,
						experimentalFeatures: {
							useBarCodeDetectorIfSupported: true,
						},
					},
					/* verbose= */ false
				);

				scanner.render(
					(decodedText) => {
						// Handle successful scan
						console.log("Book QR scanned:", decodedText);
						setBookQuery(decodedText);
						setSelectedBook(null);
						scanner
							.clear()
							.then(() => {
								setShowBookScanner(false);
							})
							.catch((err) => {
								console.error("Error clearing book scanner:", err);
								setShowBookScanner(false);
							});
					},
					(error) => {
						// Handle scan error
						if (error && !error.includes("No MultiFormat Readers") && !error.includes("NotFoundException")) {
							console.log("QR scan error:", error);
						}
					}
				);

				bookScannerRef.current = scanner;
			} catch (error) {
				console.error("Failed to start book scanner:", error);
				alert("Failed to start camera. Please check camera permissions and try again.");
				setShowBookScanner(false);
			}
		}, 300);
	};

	const stopUserScanner = () => {
		if (userScannerRef.current) {
			userScannerRef.current.clear().catch(console.error);
			userScannerRef.current = null;
		}
		setShowUserScanner(false);
	};

	const stopBookScanner = () => {
		if (bookScannerRef.current) {
			bookScannerRef.current.clear().catch(console.error);
			bookScannerRef.current = null;
		}
		setShowBookScanner(false);
	};

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
					<div className="flex gap-2 mb-2">
						<input
							ref={userInputRef}
							type="text"
							placeholder="Search user by membership ID, name or email"
							value={userQuery}
							onChange={(e) => {
								setUserQuery(e.target.value);
								setSelectedUser(null);
							}}
							className="border p-2 rounded flex-1"
							autoComplete="off"
						/>
						<button type="button" onClick={showUserScanner ? stopUserScanner : startUserScanner} className={`px-3 py-2 rounded font-medium transition ${showUserScanner ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`} title={showUserScanner ? "Stop QR Scanner" : "Scan Membership QR Code"}>
							{showUserScanner ? "🛑" : "📱"}
						</button>
					</div>

					{/* QR Scanner for User */}
					{showUserScanner && (
						<div className="mb-4 p-4 border rounded bg-gray-50">
							<div className="flex justify-between items-center mb-2">
								<h4 className="font-medium">Scan Membership QR Code</h4>
								<button type="button" onClick={stopUserScanner} className="text-red-600 hover:text-red-800">
									✕
								</button>
							</div>
							<div className="text-sm text-gray-600 mb-3">
								<p>📱 Allow camera access when prompted</p>
								<p>🎯 Point camera at QR code on membership card</p>
								<p>💡 Make sure QR code is clearly visible and well-lit</p>
								<p className="text-blue-600 mt-2">
									<strong>Tip:</strong> If camera doesn&apos;t work, you can manually type the membership number above
								</p>
							</div>
							<div id="user-qr-scanner" className="w-full"></div>
						</div>
					)}
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
										{u.role} | Membership No: {u.membershipNumber}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
				{/* Book Combobox */}
				<div>
					<label className="block mb-1 font-medium">Book</label>
					<div className="flex gap-2 mb-2">
						<input
							ref={bookInputRef}
							type="text"
							placeholder="Search book by title, author or ISBN"
							value={bookQuery}
							onChange={(e) => {
								setBookQuery(e.target.value);
								setSelectedBook(null);
							}}
							className="border p-2 rounded flex-1"
							autoComplete="off"
						/>
						<button type="button" onClick={showBookScanner ? stopBookScanner : startBookScanner} className={`px-3 py-2 rounded font-medium transition ${showBookScanner ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`} title={showBookScanner ? "Stop QR Scanner" : "Scan Book ISBN QR Code"}>
							{showBookScanner ? "🛑" : "📚"}
						</button>
					</div>

					{/* QR Scanner for Book */}
					{showBookScanner && (
						<div className="mb-4 p-4 border rounded bg-gray-50">
							<div className="flex justify-between items-center mb-2">
								<h4 className="font-medium">Scan Book ISBN QR Code</h4>
								<button type="button" onClick={stopBookScanner} className="text-red-600 hover:text-red-800">
									✕
								</button>
							</div>
							<div className="text-sm text-gray-600 mb-3">
								<p>📱 Allow camera access when prompted</p>
								<p>📚 Point camera at QR code on book cover or ISBN barcode</p>
								<p>💡 Make sure code is clearly visible and well-lit</p>
								<p className="text-blue-600 mt-2">
									<strong>Tip:</strong> If camera doesn&apos;t work, you can manually type the ISBN above
								</p>
							</div>
							<div id="book-qr-scanner" className="w-full"></div>
						</div>
					)}
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
									<div className="text-xs text-gray-500">
										{b.availableCopies} {b.isbn && `| ISBN: ${b.isbn}`}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
				<button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow" disabled={loading || !selectedUser || !selectedBook}>
					{loading ? "Issuing..." : "Issue Book"}
				</button>
				{message && (
					<div className="text-center text-sm mt-2 bg-blue-100 border border-red-300 text-red-700 rounded p-2 relative">
						{message}
						<button type="button" className="absolute right-2 top-2 text-red-700" onClick={() => setMessage("")}>
							×
						</button>
					</div>
				)}
			</form>
		</div>
	);
}
