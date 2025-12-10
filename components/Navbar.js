"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Search, Bell, Menu, X, BookOpen, Library, User } from "lucide-react";

export default function Navbar() {
	const { data: session } = useSession();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [userPhoto, setUserPhoto] = useState(null);
	const dropdownRef = useRef(null);

	// Fetch user photo since it's not in the session anymore
	useEffect(() => {
		if (session?.user?.id) {
			fetch("/api/user/photo")
				.then((res) => res.json())
				.then((data) => {
					if (data.photo) {
						setUserPhoto(data.photo);
					}
				})
				.catch((err) => console.error("Failed to fetch user photo:", err));
		}
	}, [session?.user?.id]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setOpen(false);
			}
		}
		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	// Keyboard shortcut for search (Cmd/Ctrl + K)
	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setSearchOpen(true);
			}
			if (e.key === "Escape") {
				setSearchOpen(false);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<>
			<nav className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo */}
						<Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight hover:text-blue-400 transition">
							<Library className="w-6 h-6" />
							<span className="hidden sm:inline">Mini Library</span>
							<span className="sm:hidden">ML</span>
						</Link>

						{/* Desktop Navigation */}
						{session && (
							<div className="hidden md:flex items-center gap-6">
								{session.user.role === "USER" && (
									<Link href="/my-books" className="flex items-center gap-1 hover:text-blue-400 transition">
										<BookOpen className="w-4 h-4" />
										My Books
									</Link>
								)}
							</div>
						)}

						{/* Right Side - Search, Notifications, User */}
						<div className="flex items-center gap-3">
							{/* Search */}
							{session && (
								<button onClick={() => setSearchOpen(true)} className="hidden sm:flex p-2 hover:bg-gray-700 rounded-full transition" aria-label="Search books">
									<Search className="w-5 h-5" />
								</button>
							)}

							{/* Notifications */}
							{session && (
								<button className="hidden sm:flex p-2 hover:bg-gray-700 rounded-full transition relative" aria-label="Notifications">
									<Bell className="w-5 h-5" />
									<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
								</button>
							)}

							{/* Mobile Menu Button */}
							<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-gray-700 rounded transition" aria-label="Menu">
								{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
							</button>

							{/* User Menu */}
							{session ? (
								<div className="hidden md:block relative" ref={dropdownRef}>
									<button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" aria-label="User menu">
										{userPhoto ? <img src={userPhoto} alt={session.user.name || session.user.email} className="w-8 h-8 rounded-full object-cover border-2 border-blue-400 shadow" /> : <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm border-2 border-blue-400 shadow">{session.user.name ? session.user.name.charAt(0).toUpperCase() : session.user.email.charAt(0).toUpperCase()}</span>}
										<span className="hidden lg:inline text-sm font-medium">{session.user.name || "User"}</span>
										<svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
										</svg>
									</button>
									{open && (
										<div className="absolute right-0 mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-xl z-50 border animate-fade-in">
											<div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
												<div className="font-semibold text-lg">{session.user.name || "User"}</div>
												<div className="text-sm text-gray-600">{session.user.email}</div>
												<div className="text-xs text-gray-500 mt-1 capitalize">{session.user.role}</div>
											</div>
											<div className="py-1">
												<Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition">
													<User className="w-4 h-4" />
													My Profile
												</Link>
												{session.user.role === "USER" && (
													<Link href="/my-books" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition">
														<BookOpen className="w-4 h-4" />
														My Books
													</Link>
												)}
											</div>
											<button
												onClick={() => {
													setOpen(false);
													signOut({ callbackUrl: "/auth/signin" });
												}}
												className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-semibold rounded-b-lg transition border-t"
											>
												Logout
											</button>
										</div>
									)}
								</div>
							) : (
								<Link href="/auth/signin" className="hidden md:inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium">
									Sign In
								</Link>
							)}
						</div>
					</div>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && session && (
					<div className="md:hidden bg-gray-800 border-t border-gray-700">
						<div className="px-4 py-3 space-y-2">
							{session.user.role === "USER" && (
								<Link href="/my-books" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
									<BookOpen className="w-4 h-4" />
									My Books
								</Link>
							)}
							<Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
								<User className="w-4 h-4" />
								My Profile
							</Link>
							<button onClick={() => setSearchOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition text-left">
								<Search className="w-4 h-4" />
								Search Books
							</button>
							<button
								onClick={() => {
									setMobileMenuOpen(false);
									signOut({ callbackUrl: "/auth/signin" });
								}}
								className="w-full text-left px-3 py-2 rounded hover:bg-red-600 transition text-red-400 hover:text-white"
							>
								Logout
							</button>
						</div>
					</div>
				)}
			</nav>

			{/* Search Modal */}
			{searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
		</>
	);
}

// Search Modal Component
function SearchModal({ onClose }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { data: session } = useSession();
	const timeoutRef = useRef(null);

	const searchBooks = async (query) => {
		if (query.length < 2) {
			setResults([]);
			return;
		}

		setLoading(true);
		try {
			const res = await fetch(`/api/books`);
			const books = await res.json();
			const filtered = books.filter(
				(book) => book.title.toLowerCase().includes(query.toLowerCase()) || book.author.toLowerCase().includes(query.toLowerCase()) || (book.isbn && book.isbn.toLowerCase().includes(query.toLowerCase()))
			);
			setResults(filtered.slice(0, 5));
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setSearchQuery(value);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			searchBooks(value);
		}, 300);
	};

	const handleBookClick = (bookId) => {
		router.push(`/books?bookId=${bookId}`);
		onClose();
	};

	const handleQuickAction = (action, bookId) => {
		if (action === 'issue') {
			router.push(`/admin/issue?bookId=${bookId}`);
		} else if (action === 'edit') {
			router.push(`/admin/books?id=${bookId}`);
		}
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
			<div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
				<div className="p-4 border-b">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-lg font-semibold text-gray-900">Search Library</h3>
						<div className="flex items-center gap-2">
							<kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Esc</kbd>
							<button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</div>
					</div>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input type="text" placeholder="Search by title, author, or ISBN..." value={searchQuery} onChange={handleInputChange} autoFocus className="w-full pl-10 pr-4 py-3 border-0 focus:outline-none text-gray-900 placeholder-gray-400" />
					</div>
				</div>

				{loading && (
					<div className="p-8 text-center">
						<div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
						<p className="mt-2 text-sm text-gray-500">Searching...</p>
					</div>
				)}

				{!loading && searchQuery.length >= 2 && results.length === 0 && (
					<div className="p-8 text-center">
						<BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
						<p className="text-gray-500">No books found for "{searchQuery}"</p>
					</div>
				)}

				{!loading && results.length > 0 && (
					<div className="max-h-96 overflow-y-auto">
						{results.map((book) => (
							<div key={book.id} className="p-4 hover:bg-gray-50 flex items-start gap-4 border-t transition">
								<button onClick={() => handleBookClick(book.id)} className="flex-shrink-0">
									{book.coverUrl ? (
										<img src={book.coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded border hover:shadow-lg transition" />
									) : (
										<div className="w-12 h-16 bg-blue-100 rounded flex items-center justify-center hover:bg-blue-200 transition">
											<BookOpen className="w-6 h-6 text-blue-600" />
										</div>
									)}
								</button>
								<div className="flex-1 min-w-0">
									<button onClick={() => handleBookClick(book.id)} className="text-left w-full">
										<h4 className="font-medium text-gray-900 truncate hover:text-blue-600 transition">{book.title}</h4>
										<p className="text-sm text-gray-600 truncate">by {book.author}</p>
										<div className="flex items-center gap-2 mt-1">
											{book.isbn && <span className="text-xs text-gray-500">ISBN: {book.isbn}</span>}
											<span className={`text-xs px-2 py-0.5 rounded-full ${book.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{book.available ? "Available" : "Borrowed"}</span>
										</div>
									</button>
									{/* Quick Actions */}
									<div className="flex gap-2 mt-2">
										{session?.user?.role === "ADMIN" ? (
											<>
												<button
													onClick={() => handleQuickAction('issue', book.id)}
													className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
													disabled={!book.available}
												>
													Issue Book
												</button>
												<button
													onClick={() => handleQuickAction('edit', book.id)}
													className="text-xs px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
												>
													Edit
												</button>
											</>
										) : (
											<>
												<button
													onClick={() => handleBookClick(book.id)}
													className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
												>
													View Details
												</button>
												{book.available && (
													<button
														onClick={() => handleBookClick(book.id)}
														className="text-xs px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition"
													>
														Borrow
													</button>
												)}
											</>
										)}
									</div>
								</div>
							</div>
						))}
						<div className="p-3 bg-gray-50 border-t text-center">
							<button
								onClick={() => {
									router.push("/books");
									onClose();
								}}
								className="text-sm text-blue-600 hover:text-blue-700 font-medium"
							>
								View all books →
							</button>
						</div>
					</div>
				)}

				{searchQuery.length < 2 && (
					<div className="p-8 text-center">
						<Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
						<p className="text-gray-500 text-sm">Start typing to search books...</p>
						<p className="text-gray-400 text-xs mt-1">Search by title, author, or ISBN</p>
						<p className="text-gray-400 text-xs mt-2">
							<kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Cmd/Ctrl + K</kbd> to open search
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
