"use client";
import { useEffect, useState } from "react";

export default function BorrowedBooksTable() {
	const [borrowed, setBorrowed] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchBorrowed() {
			setLoading(true);
			const res = await fetch("/api/transactions");
			const data = await res.json();
			// Only show not returned (active) borrows
			setBorrowed(data.filter((t) => !t.returned));
			setLoading(false);
		}
		fetchBorrowed();
	}, []);

	return (
		<div className="bg-white rounded-xl shadow p-6 mt-8">
			<h2 className="text-xl font-semibold mb-4">Currently Borrowed Books</h2>
			{loading ? (
				<div className="text-gray-500">Loading...</div>
			) : borrowed.length === 0 ? (
				<div className="text-gray-500">No books are currently borrowed.</div>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved At</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine (NOK)</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{borrowed.map((t) => (
								<tr key={t.id}>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{t.book?.title || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{t.user?.name || t.user?.email || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{t.fine || 0}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
