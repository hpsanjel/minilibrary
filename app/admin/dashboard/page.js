"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BookIcon, HandGrab, List, Menu, UserIcon, X, Search } from "lucide-react";
import QuickSearchBox from "@/components/QuickSearchBox";

export default function AdminDashboard() {
	const [stats, setStats] = useState({
		books: 0,
		users: 0,
		transactions: 0,
		borrowed: 0,
	});
	const [loading, setLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();

	useEffect(() => {
		async function fetchStats() {
			setLoading(true);
			const [booksRes, usersRes, txRes] = await Promise.all([fetch("/api/books"), fetch("/api/users"), fetch("/api/transactions")]);
			const books = await booksRes.json();
			const users = await usersRes.json();
			const transactions = await txRes.json();

			setStats({
				books: books.length,
				users: users.length,
				transactions: transactions.length,
				borrowed: books.filter((b) => !b.available).length,
			});
			setLoading(false);
		}
		fetchStats();
	}, []);

	const pieData = [
		{ name: "Available", value: stats.books - stats.borrowed },
		{ name: "Borrowed", value: stats.borrowed },
	];

	const COLORS = ["#3b82f6", "#f59e0b"];

	return (
		<div className="flex min-h-screen bg-gray-100">
			{/* Sidebar - Mobile Overlay */}
			{/* {sidebarOpen && (
				<div className="fixed inset-0 z-40 flex md:hidden">
					<div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)}></div>
					<aside className="relative z-50 w-64 bg-white shadow-lg p-6">
						<button className="absolute top-4 right-4" onClick={() => setSidebarOpen(false)}>
							<X className="w-6 h-6" />
						</button>
						<SidebarNav router={router} />
					</aside>
				</div>
			)} */}

			{/* Sidebar - Desktop */}
			{/* <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg">
				<div className="p-6 text-2xl font-bold border-b">📚 Admin</div>
				<SidebarNav router={router} />
			</aside> */}

			{/* Main Content */}
			<div className="flex-1 p-6">
				{/* Header */}
				<header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
					<div className="flex items-center space-x-4">
						<button className="md:hidden" onClick={() => setSidebarOpen(true)}>
							<Menu className="w-7 h-7" />
						</button>
						<h1 className="text-3xl font-bold">Admin Dashboard</h1>
					</div>
					<div className="flex items-center space-x-4">
						<QuickSearchBox placeholder="Search users or books..." className="w-full sm:w-80 md:w-120" />
					</div>
				</header>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
					<StatCard title="Books" value={loading ? "-" : stats.books} icon={<BookIcon />} color="from-blue-400 to-blue-600" href="/admin/books" />
					<StatCard title="Users" value={loading ? "-" : stats.users} icon={<UserIcon />} color="from-green-400 to-green-600" href="/admin/users" />
					<StatCard title="Transactions" value={loading ? "-" : stats.transactions} icon={<List />} color="from-purple-400 to-purple-600" href="/admin/transactions" />
					<StatCard title="Issue" value={loading ? "-" : "300"} icon={<HandGrab />} color="from-orange-400 to-orange-600" href="/admin/issue" />
					<StatCard title="Reports" value={loading ? "-" : "7"} icon={<Search />} color="from-teal-400 to-teal-600" href="/admin/dashboard/reports" />
				</div>

				{/* Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Pie Chart */}
					<div className="bg-white rounded-xl shadow p-6">
						<h2 className="text-xl font-bold mb-4">Books Availability</h2>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
									{pieData.map((_, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* Bar Chart */}
					<div className="bg-white rounded-xl shadow p-6">
						<h2 className="text-xl font-bold mb-4">Overview</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart
								data={[
									{ name: "Books", value: stats.books },
									{ name: "Users", value: stats.users },
									{ name: "Transactions", value: stats.transactions },
								]}
							>
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="value" fill="#3b82f6" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}

// Sidebar Links
// function SidebarNav({ router }) {
// 	return (
// 		<nav className="flex-1 p-4 space-y-3">
// 			<button onClick={() => router.push("/admin/books")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
// 				Books
// 			</button>
// 			<button onClick={() => router.push("/admin/users")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
// 				Users
// 			</button>
// 			<button onClick={() => router.push("/admin/transactions")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
// 				Transactions
// 			</button>
// 			<button onClick={() => router.push("/admin/issues")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
// 				Issues
// 			</button>
// 			<button onClick={() => router.push("/admin/returns")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
// 				Returns
// 			</button>
// 			<button onClick={() => router.push("/admin/dashboard/reports")} className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
// 				Reports
// 			</button>
// 		</nav>
// 	);
// }

// Reusable Stat Card (now navigable)
function StatCard({ title, value, color, icon, href }) {
	const router = useRouter();
	return (
		<div
			onClick={() => router.push(href)}
			className={`bg-gradient-to-r ${color} rounded-xl shadow p-6 flex flex-col items-center 
                        hover:shadow-lg hover:scale-105 transition cursor-pointer text-white`}
		>
			<div className={`bg-white text-gray-600 bg-opacity-20 rounded-full p-3 mb-3`}>{icon}</div>
			<div className="text-2xl font-bold">{value}</div>
			<div className="text-sm opacity-80">{title}</div>
		</div>
	);
}
