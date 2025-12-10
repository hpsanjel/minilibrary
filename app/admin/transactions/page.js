"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";

export default function AdminTransactionsPage() {
	const searchParams = useSearchParams();
	const userIdParam = searchParams.get("userId");
	const filterParam = searchParams.get("filter");
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState(filterParam || "all");
	const [showFineModal, setShowFineModal] = useState(false);
	const [pendingIssueTx, setPendingIssueTx] = useState(null);
	const [showClearFineModal, setShowClearFineModal] = useState(false);
	const [pendingClearFineTx, setPendingClearFineTx] = useState(null);
	const [showFineWarningModal, setShowFineWarningModal] = useState(false);
	const [pendingReturnTx, setPendingReturnTx] = useState(null);
	const [successMessage, setSuccessMessage] = useState("");
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);

	// Modal loading states
	const [modalLoading, setModalLoading] = useState(false);

	// Button states for each transaction
	const [processingButtons, setProcessingButtons] = useState({}); // { transactionId: 'issue'|'return'|'clearFine' }
	const [successButtons, setSuccessButtons] = useState({}); // { transactionId: 'issue'|'return'|'clearFine' }

	const handleClearFine = (tx) => {
		// Calculate current fine amount
		const now = new Date();
		const deadline = new Date(tx.deadline);
		const isOverdue = now > deadline && !tx.returned;
		const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));
		const currentFine = isOverdue ? Math.max(0, daysOverdue * 5) : 0;

		// Set processing state
		setProcessingButtons((prev) => ({ ...prev, [tx.id]: "clearFine" }));

		// Store transaction with calculated fine for modal display
		setPendingClearFineTx({ ...tx, currentFine });
		setShowClearFineModal(true);
	};

	const confirmClearFine = async () => {
		if (!pendingClearFineTx) return;

		const transactionId = pendingClearFineTx.id;

		try {
			const res = await fetch("/api/transactions", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: transactionId, action: "clearFine" }),
			});

			if (res.ok) {
				// Set success state
				setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
				setSuccessButtons((prev) => ({ ...prev, [transactionId]: "clearFine" }));

				// Clear success state after 3 seconds
				setTimeout(() => {
					setSuccessButtons((prev) => ({ ...prev, [transactionId]: null }));
				}, 3000);

				setShowClearFineModal(false);
				setPendingClearFineTx(null);
				fetchTransactions();
			} else {
				// Clear processing state on error
				setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
				setShowClearFineModal(false);
				setPendingClearFineTx(null);
			}
		} catch (error) {
			// Clear processing state on error
			setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
			setShowClearFineModal(false);
			setPendingClearFineTx(null);
		}
	};

	const clearFineAndMarkReturned = async () => {
		if (!pendingReturnTx) return;

		const transactionId = pendingReturnTx.id;

		// Set processing state
		setProcessingButtons((prev) => ({ ...prev, [transactionId]: "return" }));

		try {
			// Calculate current fine amount for the fine payment record
			const now = new Date();
			const deadline = new Date(pendingReturnTx.deadline);
			const isOverdue = now > deadline;
			const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));
			const currentFine = isOverdue ? Math.max(0, daysOverdue * 5) : 0;

			// First, record the fine payment if there's a fine to clear
			if (currentFine > 0) {
				const finePaymentRes = await fetch("/api/fine-payments", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						transactionId: transactionId,
						userId: pendingReturnTx.userId,
						amount: currentFine,
						reason: `Fine cleared for overdue book: ${pendingReturnTx.Book.title}`,
						clearedBy: "admin", // You might want to get actual admin user info
					}),
				});

				if (!finePaymentRes.ok) {
					throw new Error("Failed to record fine payment");
				}
			}

			// Then, mark the book as returned and clear the fine
			const returnRes = await fetch("/api/transactions", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: transactionId,
					action: "return",
					clearFine: true, // Add flag to clear fine
					fineAmount: currentFine, // Pass the fine amount for email
				}),
			});

			if (returnRes.ok) {
				// Set success state
				setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
				setSuccessButtons((prev) => ({ ...prev, [transactionId]: "return" }));

				// Clear success state after 3 seconds
				setTimeout(() => {
					setSuccessButtons((prev) => ({ ...prev, [transactionId]: null }));
				}, 3000);

				// Show success message
				setSuccessMessage(`Book returned successfully! Fine of ${currentFine} NOK cleared.`);
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 5000);

				// Close modal and refresh data
				setShowFineWarningModal(false);
				setPendingReturnTx(null);
				fetchTransactions();
			} else {
				throw new Error("Failed to return book");
			}
		} catch (error) {
			console.error("Failed to clear fine and return book:", error);
			// Clear processing state on error
			setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
			// Show error message
			setSuccessMessage(`Error: ${error.message || "Failed to clear fine and return book"}`);
			setShowSuccessMessage(true);
			setTimeout(() => setShowSuccessMessage(false), 5000);
		}
	};

	const fetchTransactions = async () => {
		try {
			const res = await fetch("/api/transactions");
			const data = await res.json();
			setTransactions(data);
		} catch (error) {
			console.error("Failed to fetch transactions:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTransactions();
	}, []);

	const handleIssue = async (transactionId) => {
		// Set processing state
		setProcessingButtons((prev) => ({ ...prev, [transactionId]: "issue" }));

		try {
			const res = await fetch("/api/transactions", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: transactionId, action: "issue" }),
			});

			if (res.ok) {
				const result = await res.json();
				const emailSent = result.emailSent ? " and confirmation email sent to user" : "";
				setSuccessMessage(`Book re-issued successfully${emailSent}!`);
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 5000);

				// Set success state
				setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
				setSuccessButtons((prev) => ({ ...prev, [transactionId]: "issue" }));

				// Clear success state after 3 seconds
				setTimeout(() => {
					setSuccessButtons((prev) => ({ ...prev, [transactionId]: null }));
				}, 3000);

				fetchTransactions();
			} else {
				const error = await res.json();
				setSuccessMessage(`Error re-issuing book: ${error.error || "Unknown error"}`);
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 5000);

				// Clear processing state on error
				setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
			}
		} catch (error) {
			setSuccessMessage(`Error re-issuing book: ${error.message || "Network error"}`);
			setShowSuccessMessage(true);
			setTimeout(() => setShowSuccessMessage(false), 5000);

			// Clear processing state on error
			setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
		}
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

	// 🔑 Calculate available copies per book
	const availableCopies = useMemo(() => {
		const bookCounts = {};
		transactions.forEach((tx) => {
			if (!tx.returned) {
				bookCounts[tx.bookId] = (bookCounts[tx.bookId] || 0) + 1;
			}
		});

		// Calculate available copies (total - borrowed)
		const available = {};
		transactions.forEach((tx) => {
			if (!available[tx.bookId]) {
				const borrowedCount = bookCounts[tx.bookId] || 0;
				available[tx.bookId] = Math.max(0, (tx.Book.copies || 1) - borrowedCount);
			}
		});

		return available;
	}, [transactions]);

	// Filtered transactions based on filter state
	const filteredTransactions = useMemo(() => {
		let result = transactions;

		if (userIdParam) {
			result = result.filter(tx => tx.userId === parseInt(userIdParam));
		}

		if (filter === "all") return result;
		if (filter === "borrowed") return result.filter((tx) => !tx.returned);
		if (filter === "returned") return result.filter((tx) => tx.returned);
		return result;
	}, [transactions, filter, userIdParam]);

	return (
		<div className="flex min-h-screen">
			{/* <AdminSidebar /> */}
			<div className="flex-1 p-6">
				<h1 className="text-2xl font-bold mb-6">Transactions</h1>

				{/* Success Message */}
				{showSuccessMessage && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{successMessage}</div>}

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
								{/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrowed At</th> */}
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
									const now = new Date();
									const deadline = new Date(tx.deadline);
									const isOverdue = now > deadline && !tx.returned;
									const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));

									// Calculate current fine amount
									const currentFine = tx.returned ? tx.fine : isOverdue ? Math.max(0, daysOverdue * 5) : 0;

									return (
										<tr key={tx.id} className={isOverdue ? "bg-red-50" : ""}>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex flex-col">
													<div className="text-sm font-medium text-gray-900">{tx.User.name}</div>
													<div className="text-sm text-gray-500">{tx.User.email}</div>
													<div className="text-sm text-gray-500">Phone: {tx.User.phone || "N/A"}</div>
													<div className="text-sm text-gray-500">Address: {tx.User.address || "N/A"}</div>
													<div className="text-xs text-blue-600">Books borrowed: {activeBorrowCount[tx.userId] || 0}</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">{tx.Book.title}</div>
												<div className="text-sm text-gray-500">by {tx.Book.author}</div>
												<div className="text-sm text-gray-500">ISBN: {tx.Book.isbn}</div>
											</td>
											{/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(tx.createdAt).toLocaleDateString()}</td> */}
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(tx.deadline).toLocaleDateString()}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.returnedAt ? new Date(tx.returnedAt).toLocaleDateString() : "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currentFine.toFixed(2)}</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{tx.returned ? (
													<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Returned</span>
												) : isOverdue ? (
													<div className="flex flex-col gap-1">
														<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Overdue</span>
														<span className="text-xs text-red-600">{daysOverdue} days late</span>
													</div>
												) : (
													<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Borrowed</span>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-y-2">
												{!tx.returned && (
													<div className="flex flex-col gap-2">
														<button
															onClick={() => {
																// Check if there are any outstanding fines (use consistent calculation)
																if (currentFine > 0) {
																	// Show warning modal - cannot return with outstanding fines
																	setPendingReturnTx(tx);
																	setShowFineWarningModal(true);
																} else {
																	// Proceed with normal return process
																	setProcessingButtons((prev) => ({ ...prev, [tx.id]: "return" }));
																	setPendingIssueTx(tx);
																	setShowFineModal(true);
																}
															}}
															className={`px-4 py-1 rounded text-sm flex items-center gap-1 ${processingButtons[tx.id] === "return" ? "bg-gray-400 text-white cursor-not-allowed" : successButtons[tx.id] === "return" ? "bg-green-500 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
															disabled={processingButtons[tx.id] === "return"}
														>
															{processingButtons[tx.id] === "return" ? (
																<>
																	<svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
																		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
																		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																	</svg>
																	Processing...
																</>
															) : successButtons[tx.id] === "return" ? (
																<>
																	<svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																	</svg>
																	Returned
																</>
															) : (
																"Mark Returned"
															)}
														</button>
													</div>
												)}
												{tx.returned && (
													<div className="flex flex-col gap-2">
														<button
															onClick={() => {
																// Check if there are any outstanding fines before reissuing
																if (currentFine > 0) {
																	// Show fine modal for outstanding fines
																	setPendingIssueTx(tx);
																	setShowFineModal(true);
																	return;
																}

																// Check if button should be disabled due to user limits or book availability
																const userBorrowCount = activeBorrowCount[tx.userId] || 0;
																const bookAvailable = availableCopies[tx.bookId] || 0;
																const isDisabledDueToLimit = userBorrowCount >= 2;
																const isDisabledDueToAvailability = bookAvailable <= 0;

																if (isDisabledDueToLimit || isDisabledDueToAvailability) return;

																handleIssue(tx.id);
															}}
															className={`px-4 py-1 rounded text-sm flex items-center gap-1 ${(() => {
																const userBorrowCount = activeBorrowCount[tx.userId] || 0;
																const bookAvailable = availableCopies[tx.bookId] || 0;
																const isDisabledDueToLimit = userBorrowCount >= 2;
																const isDisabledDueToAvailability = bookAvailable <= 0;
																const isButtonDisabled = processingButtons[tx.id] === "issue" || isDisabledDueToLimit || isDisabledDueToAvailability;

																return isButtonDisabled ? "bg-gray-400 text-white cursor-not-allowed" : successButtons[tx.id] === "issue" ? "bg-green-500 text-white" : "bg-yellow-600 hover:bg-yellow-700 text-white";
															})()}`}
															disabled={(() => {
																const userBorrowCount = activeBorrowCount[tx.userId] || 0;
																const bookAvailable = availableCopies[tx.bookId] || 0;
																const isDisabledDueToLimit = userBorrowCount >= 2;
																const isDisabledDueToAvailability = bookAvailable <= 0;
																return processingButtons[tx.id] === "issue" || isDisabledDueToLimit || isDisabledDueToAvailability;
															})()}
															title={(() => {
																const userBorrowCount = activeBorrowCount[tx.userId] || 0;
																const bookAvailable = availableCopies[tx.bookId] || 0;
																const isDisabledDueToLimit = userBorrowCount >= 2;
																const isDisabledDueToAvailability = bookAvailable <= 0;

																return isDisabledDueToLimit ? "User has reached maximum borrow limit (2 books)" : isDisabledDueToAvailability ? "No available copies of this book" : "";
															})()}
														>
															{processingButtons[tx.id] === "issue" ? (
																<>
																	<svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
																		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
																		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																	</svg>
																	Processing...
																</>
															) : successButtons[tx.id] === "issue" ? (
																<>
																	<svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																	</svg>
																	Issued
																</>
															) : (
																(() => {
																	const userBorrowCount = activeBorrowCount[tx.userId] || 0;
																	const bookAvailable = availableCopies[tx.bookId] || 0;
																	const isDisabledDueToLimit = userBorrowCount >= 2;
																	const isDisabledDueToAvailability = bookAvailable <= 0;

																	if (isDisabledDueToLimit) return "Max Limit Reached";
																	if (isDisabledDueToAvailability) return "No Copies Available";
																	return "Issue Again";
																})()
															)}
														</button>
													</div>
												)}
												{
													/* currentFine > 0 && */ false && (
														<button onClick={() => handleClearFine(tx)} className={`px-4 py-1 rounded text-sm flex items-center gap-1 ${processingButtons[tx.id] === "clearFine" ? "bg-gray-400 text-white cursor-not-allowed" : successButtons[tx.id] === "clearFine" ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`} disabled={processingButtons[tx.id] === "clearFine"}>
															{processingButtons[tx.id] === "clearFine" ? (
																<>
																	<svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
																		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
																		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																	</svg>
																	Processing...
																</>
															) : successButtons[tx.id] === "clearFine" ? (
																<>
																	<svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																	</svg>
																	Cleared
																</>
															) : (
																"Clear Fine"
															)}
														</button>
													)
												}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Fine Calculation Modal */}
			{showFineModal && pendingIssueTx && (
				<ConfirmationModal
					isOpen={showFineModal}
					isLoading={modalLoading}
					onClose={() => {
						if (!modalLoading) {
							setShowFineModal(false);
							setPendingIssueTx(null);
						}
					}}
					onConfirm={async () => {
						const transactionId = pendingIssueTx.id;

						// Set modal loading state
						setModalLoading(true);

						// Calculate days overdue
						const now = new Date();
						const deadline = new Date(pendingIssueTx.deadline);
						const daysOverdue = Math.max(0, Math.ceil((now - deadline) / (1000 * 60 * 60 * 24)));

						// Calculate fine: 5 NOK per day overdue
						const fine = daysOverdue * 5;

						try {
							const res = await fetch("/api/transactions", {
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									id: transactionId,
									action: "return",
									fine,
									sendEmailConfirmation: true, // Send email only when user confirms
								}),
							});

							if (res.ok) {
								// Clear modal loading state
								setModalLoading(false);

								// Set success state
								setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
								setSuccessButtons((prev) => ({ ...prev, [transactionId]: "return" }));

								// Clear success state after 3 seconds
								setTimeout(() => {
									setSuccessButtons((prev) => ({ ...prev, [transactionId]: null }));
								}, 3000);

								setShowFineModal(false);
								setPendingIssueTx(null);
								fetchTransactions();
							} else {
								// Clear modal loading state and processing state on error
								setModalLoading(false);
								setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
								setShowFineModal(false);
								setPendingIssueTx(null);
							}
						} catch (error) {
							// Clear modal loading state and processing state on error
							setModalLoading(false);
							setProcessingButtons((prev) => ({ ...prev, [transactionId]: null }));
							setShowFineModal(false);
							setPendingIssueTx(null);
						}
					}}
					title="Mark Book as Returned"
					message={(() => {
						const now = new Date();
						const deadline = new Date(pendingIssueTx.deadline);
						const daysOverdue = Math.max(0, Math.ceil((now - deadline) / (1000 * 60 * 60 * 24)));
						const fine = daysOverdue * 5;

						return (
							<>
								<div>
									<strong>Book:</strong> {pendingIssueTx.Book.title}
								</div>
								<div>
									<strong>Deadline:</strong> {new Date(pendingIssueTx.deadline).toLocaleDateString()}
								</div>
								<div>
									<strong>Days Overdue:</strong> {daysOverdue}
								</div>
								<div>
									<strong>Fine:</strong> {fine} NOK
								</div>
								<div className="mt-2">Are you sure you want to mark this book as returned?</div>
							</>
						);
					})()}
					confirmText="Mark Returned"
					cancelText="Cancel"
				/>
			)}

			{/* Clear Fine Modal */}
			{showClearFineModal && pendingClearFineTx && (
				<ConfirmationModal
					isOpen={showClearFineModal}
					isLoading={modalLoading}
					onClose={() => {
						if (!modalLoading) {
							setShowClearFineModal(false);
							setPendingClearFineTx(null);
						}
					}}
					onConfirm={() => {
						setModalLoading(true);
						confirmClearFine().finally(() => setModalLoading(false));
					}}
					title="Clear Fine"
					message={
						<>
							<div>
								<strong>User:</strong> {pendingClearFineTx.User.name}
							</div>
							<div>
								<strong>Book:</strong> {pendingClearFineTx.Book.title}
							</div>
							<div>
								<strong>Fine:</strong> {pendingClearFineTx.currentFine || pendingClearFineTx.fine} NOK
							</div>
							<div className="mt-2">Are you sure you want to clear this fine?</div>
						</>
					}
					confirmText="Clear Fine"
					cancelText="Cancel"
				/>
			)}

			{/* Fine Warning Modal */}
			{showFineWarningModal && pendingReturnTx && (
				<ConfirmationModal
					isOpen={showFineWarningModal}
					isLoading={modalLoading}
					onClose={() => {
						if (!modalLoading) {
							setShowFineWarningModal(false);
							setPendingReturnTx(null);
						}
					}}
					onConfirm={() => {
						setModalLoading(true);
						clearFineAndMarkReturned().finally(() => setModalLoading(false));
					}}
					title="Outstanding Fine - Clear and Return Book"
					message={(() => {
						const now = new Date();
						const deadline = new Date(pendingReturnTx.deadline);
						const isOverdue = now > deadline;
						const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));
						// Use same calculation as table display
						const currentFine = isOverdue ? Math.max(0, daysOverdue * 5) : 0;

						return (
							<div>
								<div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
									<div className="flex items-center mb-2">
										<svg className="h-5 w-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										<span className="font-medium text-amber-800">Outstanding Fine Detected</span>
									</div>
									<p className="text-amber-700">This book has an outstanding fine that will be automatically cleared when you mark it as returned.</p>
								</div>
								<div className="space-y-2 text-sm">
									<div>
										<strong>Student:</strong> {pendingReturnTx.User.name}
									</div>
									<div>
										<strong>Book:</strong> {pendingReturnTx.Book.title}
									</div>
									<div>
										<strong>Deadline:</strong> {new Date(pendingReturnTx.deadline).toLocaleDateString()}
									</div>
									<div>
										<strong>Days Overdue:</strong> {daysOverdue} days
									</div>
									<div className="text-red-600 font-medium border-t pt-2">
										<strong>Total Fine Due:</strong> {currentFine} NOK
									</div>
								</div>
								<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
									<p className="text-green-800 text-sm">
										<strong>Action:</strong> Click &quot;Clear Fine and Mark Returned&quot; to automatically clear the outstanding fine and mark this book as returned.
									</p>
								</div>
							</div>
						);
					})()}
					confirmText="Clear Fine and Mark Returned"
					confirmClass="bg-green-600 text-white hover:bg-green-700"
					hideCancel={false}
				/>
			)}
		</div>
	);
}
