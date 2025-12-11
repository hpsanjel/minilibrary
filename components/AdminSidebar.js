"use client";

import { usePathname, useRouter } from "next/navigation";
import { Book, UserIcon, List, FileWarning, BarChart3, LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminSidebar() {
	const router = useRouter();
	const pathname = usePathname();

	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
		{ name: "Books", icon: Book, path: "/admin/books" },
		{ name: "Users", icon: UserIcon, path: "/admin/users" },
		{ name: "Transactions", icon: List, path: "/admin/transactions" },
		{ name: "Issue Book", icon: FileWarning, path: "/admin/issue" },
		{ name: "Reports", icon: BarChart3, path: "/admin/dashboard/reports" },
	];

	const isActive = (path) => pathname === path;

	return (
		<aside className="hidden md:flex flex-col w-72 flex-shrink-0 bg-slate-900 text-white shadow-xl h-[calc(100vh-4rem)] transition-all duration-300">
			{/* Header */}
			{/* <div className="p-6 border-b border-slate-800">
				<div
					className="flex items-center gap-3 cursor-pointer group"
					onClick={() => router.push("/admin/dashboard")}
				>
					<div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
						<Book className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-wide">Mini Library</h1>
						<p className="text-xs text-slate-400 uppercase tracking-wider">Admin Panel</p>
					</div>
				</div>
			</div> */}

			{/* Navigation */}
			<nav className="flex-1 p-4 space-y-2 overflow-y-auto">
				{/* <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">
					Main Menu
				</p> */}
				{menuItems.map((item) => {
					const active = isActive(item.path);
					return (
						<button
							key={item.path}
							onClick={() => router.push(item.path)}
							className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
								? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
								: "text-slate-400 hover:bg-slate-800 hover:text-white"
								}`}
						>
							<item.icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
							<span className="font-medium">{item.name}</span>
							{active && (
								<div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
							)}
						</button>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="p-4 border-t border-slate-800">
				<button
					onClick={() => signOut({ callbackUrl: "/auth/signin" })}
					className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
				>
					<LogOut className="w-5 h-5 group-hover:text-red-400" />
					<span className="font-medium">Sign Out</span>
				</button>
			</div>
		</aside>
	);
}
