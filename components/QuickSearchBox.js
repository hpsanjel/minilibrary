"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, User, BookOpen, X } from "lucide-react";

export default function QuickSearchBox({ placeholder = "Quick search...", className = "" }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState({ users: [], books: [] });
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const searchRef = useRef(null);
	const timeoutRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const fetchSuggestions = async (query) => {
		if (query.length < 2) {
			setSuggestions({ users: [], books: [] });
			setShowSuggestions(false);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			setSuggestions({
				users: data.users.slice(0, 3),
				books: data.books.slice(0, 3),
			});
			setShowSuggestions(true);
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setSearchQuery(value);

		// Clear previous timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Set new timeout for debounced search
		timeoutRef.current = setTimeout(() => {
			fetchSuggestions(value);
		}, 300);
	};

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
			setShowSuggestions(false);
		}
	};

	const handleSuggestionClick = (type, id) => {
		if (type === "user") {
			router.push(`/admin/users?id=${id}`);
		} else if (type === "book") {
			router.push(`/admin/books?id=${id}`);
		}
		setShowSuggestions(false);
		setSearchQuery("");
	};

	const clearSearch = () => {
		setSearchQuery("");
		setSuggestions({ users: [], books: [] });
		setShowSuggestions(false);
	};

	return (
		<div ref={searchRef} className={`relative ${className}`}>
			<form onSubmit={handleSearch} className="relative">
				<div className="flex">
					<input type="text" placeholder={placeholder} value={searchQuery} onChange={handleInputChange} onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)} className="w-full px-4 py-2.5 pl-12 pr-12 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base shadow-sm" />
					<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
					{searchQuery && (
						<button type="button" onClick={clearSearch} className="absolute right-16 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors">
							<X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
						</button>
					)}
					<button type="submit" className="px-4 md:px-6 py-2.5 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm">
						<Search className="w-5 h-5" />
					</button>
				</div>
			</form>{" "}
			{/* Suggestions Dropdown */}
			{showSuggestions && (suggestions.users.length > 0 || suggestions.books.length > 0) && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
					{suggestions.users.length > 0 && (
						<div>
							<div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b bg-gray-50">Users</div>
							{suggestions.users.map((user) => (
								<button key={user.id} onClick={() => handleSuggestionClick("user", user.id)} className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors">
									<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
										<User className="w-5 h-5 text-blue-600" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
										<div className="text-xs text-gray-500 truncate">
											{user.email} • {user.membershipNumber || "N/A"}
										</div>
									</div>
								</button>
							))}
						</div>
					)}

					{suggestions.books.length > 0 && (
						<div>
							<div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b bg-gray-50">Books</div>
							{suggestions.books.map((book) => (
								<button key={book.id} onClick={() => handleSuggestionClick("book", book.id)} className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors">
									<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
										<BookOpen className="w-5 h-5 text-green-600" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-gray-900 truncate">{book.title}</div>
										<div className="text-xs text-gray-500 truncate">
											by {book.author} • {book.isbn}
										</div>
									</div>
								</button>
							))}
						</div>
					)}

					{/* View All Results */}
					<button onClick={handleSearch} className="w-full px-4 py-4 text-left hover:bg-blue-50 text-blue-600 text-sm font-medium border-t bg-gray-50 transition-colors">
						<div className="flex items-center gap-2">
							<Search className="w-4 h-4" />
							View all results for "{searchQuery}"
						</div>
					</button>
				</div>
			)}
			{/* Loading indicator */}
			{loading && showSuggestions && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-6 text-center">
					<div className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
					<span className="ml-3 text-sm text-gray-600">Searching...</span>
				</div>
			)}
		</div>
	);
}
