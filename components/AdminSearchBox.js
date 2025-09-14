"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function AdminSearchBox({ placeholder = "Search users or books...", className = "" }) {
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	return (
		<form onSubmit={handleSearch} className={`relative ${className}`}>
			<div className="flex">
				<input type="text" placeholder={placeholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base" />
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
				<button type="submit" className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
					<Search className="w-4 h-4" />
				</button>
			</div>
		</form>
	);
}
