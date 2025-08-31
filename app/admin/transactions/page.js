"use client";
import { useEffect, useState, useMemo } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";

export default function AdminTransactionsPage() {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("all");
	const [showFineModal, setShowFineModal] = useState(false);
	const [pendingIssueTx, setPendingIssueTx] = useState(null);
	const [showClearFineModal, setShowClearFineModal] = useState(false);
	const [pendingClearFineTx, setPendingClearFineTx] = useState(null);
	const handleClearFine = (tx) => {
		setPendingClearFineTx(tx);
		setShowClearFineModal(true);
	};

	const confirmClearFine = async () => {
		if (!pendingClearFineTx) return;
		await fetch("/api/transactions", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: pendingClearFineTx.id, action: "clearFine" }),
		});
		setShowClearFineModal(false);
		setPendingClearFineTx(null);
		fetchTransactions();
	};

	const fetchTransactions = async () => {
		setLoading(true);
		const res = await fetch("/api/transactions");
		const data = await res.json();
		setTransactions(data);
		setLoading(false);
	};

	useEffect(() => {
		fetchTransactions();
	}, []);

	const handleReturn = async (id) => {
		await fetch("/api/transactions", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, action: "return" }),
		});
		fetchTransactions();
	};

	const handleIssue = async (id, userId) => {
		// Only block if user has any outstanding fine (fine > 0) for any transaction
		const userFines = transactions.filter((tx) => tx.userId === userId && typeof tx.fine === "number" && tx.fine > 0);
		let maxFine = 0;
		userFines.forEach((tx) => {
			if (typeof tx.fine === "number" && tx.fine > maxFine) maxFine = tx.fine;
		});
		if (maxFine > 0) {
			setPendingIssueTx({ id, fine: maxFine });
			setShowFineModal(true);
			return;
		}
		await fetch("/api/transactions", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, action: "issue" }),
		});
		fetchTransactions();
	};

	// 🔑 Count active borrowed books per user
	const activeBorrowCount = useMemo(() => {
		const counts = {};
		transactions.forEach((tx) => {
			if (!tx.returned) {
				counts[tx.userId] = (counts[tx.userId] || 0) + 1;
			}
		});
		return counts;
	}, [transactions]);

	// Filtered transactions based on filter state
	const filteredTransactions = useMemo(() => {
		if (filter === "all") return transactions;
		if (filter === "borrowed") return transactions.filter((tx) => !tx.returned);
		if (filter === "returned") return transactions.filter((tx) => tx.returned);
		return transactions;
	}, [transactions, filter]);

	return (
		<div className="flex min-h-screen">
			{/* <AdminSidebar /> */}
			<div className="flex-1 p-6">
				<h1 className="text-2xl font-bold mb-6">Transactions</h1>
				{/* Filter Controls */}
				<div className="mb-4 flex gap-2">
					<button className={`px-4 py-2 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`} onClick={() => setFilter("all")}>
						All
					</button>
					<button className={`px-4 py-2 rounded ${filter === "borrowed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`} onClick={() => setFilter("borrowed")}>
						Borrowed
					</button>
					<button className={`px-4 py-2 rounded ${filter === "returned" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`} onClick={() => setFilter("returned")}>
						Returned
					</button>
				</div>
				<div className="overflow-x-auto rounded-lg shadow border bg-white">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrowed At</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned At</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine (NOK)</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td colSpan={6} className="text-center py-8 text-gray-400">
										Loading...
									</td>
								</tr>
							) : filteredTransactions.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-8 text-gray-400">
										No transactions found.
									</td>
								</tr>
							) : (
								filteredTransactions.map((tx) => {
									const borrowedCount = activeBorrowCount[tx.userId] || 0;
									const disableIssue = borrowedCount >= 2;
									return (
										<tr key={tx.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm">{tx.user?.name || tx.user?.email || "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{tx.book?.title || "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{`${new Date(tx.createdAt).toLocaleDateString()} ${new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{tx.deadline ? `${new Date(tx.deadline).toLocaleDateString()} ${new Date(tx.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{tx.returnedAt ? `${new Date(tx.returnedAt).toLocaleDateString()} ${new Date(tx.returnedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{typeof tx.fine === "number" && tx.fine > 0 ? tx.fine : 0}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												<span className={`px-2 py-1 rounded text-xs font-medium ${tx.returned ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{tx.returned ? "Returned" : "Borrowed"}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
												{!tx.returned && (
													<button onClick={() => handleReturn(tx.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow text-xs">
														Mark Returned
													</button>
												)}
												{tx.returned && (
													<button onClick={() => handleIssue(tx.id, tx.userId)} disabled={disableIssue} className={`px-3 py-1 rounded shadow text-xs ${disableIssue ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}>
														Issue Again
													</button>
												)}
												{typeof tx.fine === "number" && tx.fine > 0 && (
													<button onClick={() => handleClearFine(tx)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded shadow text-xs">
														Clear Fine
													</button>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
			{/* Fine Modal for Issue Again */}
			<ConfirmationModal
				isOpen={showFineModal}
				onClose={() => {
					setShowFineModal(false);
					setPendingIssueTx(null);
				}}
				onConfirm={() => {
					setShowFineModal(false);
					setPendingIssueTx(null);
				}}
				title="Outstanding Fine"
				message={pendingIssueTx ? `This user has an outstanding fine of NOK ${pendingIssueTx.fine}. Please clear the fine before issuing again.` : ""}
				confirmText="OK"
				confirmClass="bg-blue-600 text-white hover:bg-blue-700"
			/>

			{/* Modal for Clear Fine (moved outside table row) */}
			<ConfirmationModal
				isOpen={showClearFineModal}
				onClose={() => {
					setShowClearFineModal(false);
					setPendingClearFineTx(null);
				}}
				onConfirm={confirmClearFine}
				title="Clear Fine"
				message={pendingClearFineTx ? `Are you sure you want to clear the fine for this transaction?` : ""}
				confirmText="Clear Fine"
				confirmClass="bg-green-600 text-white hover:bg-green-700"
			/>
		</div>
	);
}
