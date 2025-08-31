"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function TransactionHistorySidebar() {
	const { data: session } = useSession();
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!session) return;
		setLoading(true);
		fetch("/api/transactions")
			.then((res) => res.json())
			.then((data) => {
				setTransactions(data.filter((t) => t.userId === session.user.id));
				setLoading(false);
			});
	}, [session]);

	if (!session) return null;

	return (
		<aside className="w-full md:w-80 bg-gray-100 p-4 rounded-lg shadow-lg mb-6 md:mb-0 md:mr-6">
			<h2 className="text-lg font-bold mb-4">Your Transaction History</h2>

			{loading ? (
				<div className="text-gray-500">Loading...</div>
			) : transactions.length === 0 ? (
				<div className="text-gray-500">No transactions found.</div>
			) : (
				<ul className="space-y-3">
					{transactions.map((t) => {
						const isReturned = t.returned;
						return (
							<li
								key={t.id}
								className={`flex items-center gap-3 p-3 rounded-lg shadow transition transform hover:scale-105
                  ${isReturned ? "bg-green-50 border-l-4 border-green-500" : "bg-red-50 border-l-4 border-red-400"}`}
							>
								{/* <span className={`text-xl ${isReturned ? "text-green-500" : "text-red-500"}`}>{isReturned ? <Tick /> : <FaBook />}</span> */}
								<div className="flex-1 flex flex-col">
									<span className="font-semibold text-sm">{t.book?.title || "Book"}</span>
									<span className="text-xs text-gray-600">
										{isReturned ? "Returned" : "Borrowed"} on {new Date(t.createdAt).toLocaleDateString()}
									</span>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</aside>
	);
}
