"use client";

import { useRouter } from "next/navigation";
import { Book, UserIcon, List, FileWarning, Undo2, BarChart3 } from "lucide-react";

export default function AdminSidebar() {
	const router = useRouter();
	return (
		<aside className="hidden md:flex flex-col w-64 bg-white shadow-lg min-h-screen">
			<div className="p-6 text-2xl font-bold border-b cursor-pointer" onClick={() => router.push("/admin/dashboard")}>
				📚 Dashboard
			</div>
			<nav className="flex-1 p-4 space-y-3">
				<button onClick={() => router.push("/admin/books")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
					<Book className="w-5 h-5" /> Books
				</button>
				<button onClick={() => router.push("/admin/users")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
					<UserIcon className="w-5 h-5" /> Users
				</button>
				<button onClick={() => router.push("/admin/transactions")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
					<List className="w-5 h-5" /> Transactions
				</button>
				<button onClick={() => router.push("/admin/issue")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
					<FileWarning className="w-5 h-5" /> Issue Book
				</button>

				<button onClick={() => router.push("/admin/dashboard/reports")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
					<BarChart3 className="w-5 h-5" /> Reports
				</button>
			</nav>
		</aside>
	);
}
