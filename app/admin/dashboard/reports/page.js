"use client";
import { useState, useEffect } from "react";
import { FileDown, Printer } from "lucide-react";

export default function ReportsPage() {
	const [activeReport, setActiveReport] = useState("users");
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);

	// Fine reports state
	const [finePayments, setFinePayments] = useState([]);
	const [fineSummary, setFineSummary] = useState({});
	const [fineFilter, setFineFilter] = useState("all");

	const reports = ["users", "books", "issues", "returns", "defaulters", "fines"];

	// Get report title for print
	const getReportTitle = (reportType) => {
		const titles = {
			users: "Users Report",
			books: "Books Report",
			issues: "Book Issues Report",
			returns: "Book Returns Report",
			defaulters: "Defaulters Report",
		};
		return titles[reportType] || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
	};

	// Header mappings for meaningful display
	const getHeaderLabel = (key, reportType) => {
		const headerMappings = {
			issues: {
				id: "Transaction ID",
				userId: "User ID",
				bookId: "Book ID",
				user: "Borrower",
				book: "Book Title",
				createdAt: "Issue Date",
				deadline: "Due Date",
				returned: "Status",
				fine: "Fine Amount",
			},
			returns: {
				id: "Transaction ID",
				userId: "User ID",
				bookId: "Book ID",
				user: "Borrower",
				book: "Book Title",
				createdAt: "Issue Date",
				returnedAt: "Return Date",
				deadline: "Due Date",
				condition: "Book Condition",
				returnNotes: "Return Notes",
				fine: "Fine Amount",
			},
			defaulters: {
				id: "Transaction ID",
				userId: "User ID",
				bookId: "Book ID",
				user: "Defaulter",
				book: "Book Title",
				createdAt: "Issue Date",
				deadline: "Due Date",
				daysOverdue: "Days Overdue",
				fine: "Fine Amount",
			},
			books: {
				availableCopies: "Available Copies",
			},
		};

		return headerMappings[reportType]?.[key] || key.charAt(0).toUpperCase() + key.slice(1);
	};

	// Get column order for issues report
	const getIssuesColumnOrder = (data) => {
		if (!data || data.length === 0) return [];
		const allKeys = Object.keys(data[0]);
		// Skip first 3 columns (id, userId, bookId) and reorder user-friendly
		const filteredKeys = allKeys.filter((key, index) => index >= 3);

		// Define desired order: book, user, then other fields
		const orderedKeys = [];
		if (filteredKeys.includes("book")) orderedKeys.push("book");
		if (filteredKeys.includes("user")) orderedKeys.push("user");

		// Add remaining fields in logical order
		const remainingKeys = filteredKeys.filter((key) => !["book", "user"].includes(key));
		const preferredOrder = ["createdAt", "deadline", "returned", "fine", "returnedAt", "condition", "returnNotes"];

		preferredOrder.forEach((key) => {
			if (remainingKeys.includes(key)) orderedKeys.push(key);
		});

		// Add any remaining keys not in preferred order
		remainingKeys.forEach((key) => {
			if (!orderedKeys.includes(key)) orderedKeys.push(key);
		});

		return orderedKeys;
	};

	// Get column order for returns report
	const getReturnsColumnOrder = (data) => {
		if (!data || data.length === 0) return [];
		const allKeys = Object.keys(data[0]);
		// Skip first 3 columns (id, userId, bookId) and reorder user-friendly
		const filteredKeys = allKeys.filter((key, index) => index >= 3);

		// Define desired order: book, user, then other fields
		const orderedKeys = [];
		if (filteredKeys.includes("book")) orderedKeys.push("book");
		if (filteredKeys.includes("user")) orderedKeys.push("user");

		// Add remaining fields in logical order for returns
		const remainingKeys = filteredKeys.filter((key) => !["book", "user"].includes(key));
		const preferredOrder = ["createdAt", "returnedAt", "deadline", "condition", "fine", "returnNotes", "returned"];

		preferredOrder.forEach((key) => {
			if (remainingKeys.includes(key)) orderedKeys.push(key);
		});

		// Add any remaining keys not in preferred order
		remainingKeys.forEach((key) => {
			if (!orderedKeys.includes(key)) orderedKeys.push(key);
		});

		return orderedKeys;
	};

	// Get column order for defaulters report
	const getDefaultersColumnOrder = (data) => {
		if (!data || data.length === 0) return [];
		const allKeys = Object.keys(data[0]);
		// Skip first 3 columns (id, userId, bookId) and reorder user-friendly
		const filteredKeys = allKeys.filter((key, index) => index >= 3);

		// Define desired order: book, user, then other fields
		const orderedKeys = [];
		if (filteredKeys.includes("book")) orderedKeys.push("book");
		if (filteredKeys.includes("user")) orderedKeys.push("user");

		// Add remaining fields in logical order for defaulters
		const remainingKeys = filteredKeys.filter((key) => !["book", "user"].includes(key));
		const preferredOrder = ["createdAt", "deadline", "daysOverdue", "fine", "returned", "returnedAt", "condition", "returnNotes"];

		preferredOrder.forEach((key) => {
			if (remainingKeys.includes(key)) orderedKeys.push(key);
		});

		// Add any remaining keys not in preferred order
		remainingKeys.forEach((key) => {
			if (!orderedKeys.includes(key)) orderedKeys.push(key);
		});

		return orderedKeys;
	};
	const formatCellValue = (key, val, reportType) => {
		if (typeof val === "object" && val !== null) {
			if (key === "user") return val.name || val.email;
			if (key === "book") return val.title;
			return JSON.stringify(val);
		}

		// Format dates
		if (key.includes("At") || key === "deadline") {
			return val ? new Date(val).toLocaleDateString() : "-";
		}

		// Format status for issues
		if (key === "returned" && reportType === "issues") {
			return val ? "Returned" : "Active";
		}

		// Format days overdue for defaulters
		if (key === "daysOverdue") {
			return val > 0 ? `${val} days` : "-";
		}

		// Format fine amounts
		if (key === "fine") {
			return val > 0 ? `$${val}` : "-";
		}

		return val ?? "-";
	};

	// Fetch data when activeReport changes
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				if (activeReport === "fines") {
					// Fetch fine payments data
					const res = await fetch("/api/fine-payments");
					if (!res.ok) throw new Error("Failed to fetch fine payments");
					const json = await res.json();
					setFinePayments(json.payments || []);
					setFineSummary(json.summary || {});
				} else {
					// Fetch regular report data
					const res = await fetch(`/api/${activeReport}`);
					if (!res.ok) throw new Error("Failed to fetch report");
					const json = await res.json();
					setData(json);
				}
			} catch (error) {
				console.error("Error fetching report:", error);
				if (activeReport === "fines") {
					setFinePayments([]);
					setFineSummary({});
				} else {
					setData([]);
				}
			}
			setLoading(false);
		};
		fetchData();
	}, [activeReport]);

	// Fine payments filtering function
	const getFilteredPayments = () => {
		if (fineFilter === "all") return finePayments;

		const now = new Date();
		const filterDate = new Date();

		switch (fineFilter) {
			case "today":
				filterDate.setHours(0, 0, 0, 0);
				return finePayments.filter((payment) => new Date(payment.paidAt) >= filterDate);
			case "week":
				filterDate.setDate(now.getDate() - 7);
				return finePayments.filter((payment) => new Date(payment.paidAt) >= filterDate);
			case "month":
				filterDate.setMonth(now.getMonth() - 1);
				return finePayments.filter((payment) => new Date(payment.paidAt) >= filterDate);
			default:
				return finePayments;
		}
	};

	const filteredPayments = getFilteredPayments();
	const filteredTotal = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

	const handleDownload = (format) => {
		alert(`Downloading ${activeReport} report as ${format}`);
		// TODO: hook this to backend API (PDF/CSV export)
	};

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="p-6">
			{/* Print styles */}
			<style jsx>{`
				@media print {
					/* Hide screen elements */
					.no-print {
						display: none !important;
					}

					/* Show print content */
					.print-content {
						display: block !important;
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
						min-height: 100vh;
						background: white;
						padding: 15px;
						font-family: Arial, sans-serif;
					}

					/* Page setup for A4 */
					@page {
						size: A4 portrait;
						margin: 0.5in;
					}

					/* Header styling for print */
					.print-header {
						text-align: center;
						margin-bottom: 20px;
						border-bottom: 2px solid #000;
						padding-bottom: 10px;
					}

					.print-title {
						font-size: 20px;
						font-weight: bold;
						margin: 0 0 5px 0;
					}

					.print-subtitle {
						font-size: 16px;
						margin: 0 0 5px 0;
					}

					.print-date {
						font-size: 12px;
						color: #666;
						margin: 0;
					}

					/* Table styling for print */
					.print-table {
						width: 100%;
						border-collapse: collapse;
						font-size: 10px;
						table-layout: fixed;
						background: white;
					}

					.print-table th,
					.print-table td {
						border: 1px solid #000;
						padding: 4px 2px;
						text-align: left;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						background: white;
					}

					.print-table th {
						background-color: #f0f0f0;
						font-weight: bold;
						font-size: 9px;
					}

					/* Column widths */
					.print-table th:first-child,
					.print-table td:first-child {
						width: 8%;
					}
				}
			`}</style>

			{/* Print content - only visible when printing */}
			<div className="print-content" style={{ display: "none" }}>
				<div className="print-header">
					<h1 className="print-title">Mini Library Management System</h1>
					<h2 className="print-subtitle">{getReportTitle(activeReport)}</h2>
					<p className="print-date">Generated on: {new Date().toLocaleDateString()}</p>
				</div>

				{!loading && data.length > 0 && (
					<table className="print-table">
						<thead>
							<tr>
								{(activeReport === "users" || activeReport === "books" || activeReport === "issues" || activeReport === "returns" || activeReport === "defaulters") && <th>S.N.</th>}
								{activeReport === "issues"
									? getIssuesColumnOrder(data).map((key) => <th key={key}>{getHeaderLabel(key, activeReport)}</th>)
									: activeReport === "returns"
									? getReturnsColumnOrder(data).map((key) => <th key={key}>{getHeaderLabel(key, activeReport)}</th>)
									: activeReport === "defaulters"
									? getDefaultersColumnOrder(data).map((key) => <th key={key}>{getHeaderLabel(key, activeReport)}</th>)
									: Object.keys(data[0])
											.filter((key, index, arr) => {
												if (activeReport === "books") return key !== "id" && index !== arr.length - 1;
												if (activeReport === "users") return key !== "id";
												return true;
											})
											.map((key) => <th key={key}>{getHeaderLabel(key, activeReport)}</th>)}
							</tr>
						</thead>
						<tbody>
							{data.map((row, i) => (
								<tr key={i}>
									{(activeReport === "users" || activeReport === "books" || activeReport === "issues" || activeReport === "returns" || activeReport === "defaulters") && <td>{i + 1}</td>}
									{activeReport === "issues"
										? getIssuesColumnOrder(data).map((key, j) => <td key={j}>{formatCellValue(key, row[key], activeReport)}</td>)
										: activeReport === "returns"
										? getReturnsColumnOrder(data).map((key, j) => <td key={j}>{formatCellValue(key, row[key], activeReport)}</td>)
										: activeReport === "defaulters"
										? getDefaultersColumnOrder(data).map((key, j) => <td key={j}>{formatCellValue(key, row[key], activeReport)}</td>)
										: Object.entries(row)
												.filter(([key, val], index, arr) => {
													if (activeReport === "books") return key !== "id" && index !== arr.length - 1;
													if (activeReport === "users") return key !== "id";
													return true;
												})
												.map(([key, val], j) => <td key={j}>{formatCellValue(key, val, activeReport)}</td>)}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Screen content */}
			<div className="no-print">
				<h1 className="text-2xl font-bold mb-6">Admin Reports</h1>

				{/* Tabs */}
				<div className="flex space-x-4 mb-6">
					{reports.map((r) => (
						<button key={r} onClick={() => setActiveReport(r)} className={`px-4 py-2 rounded-lg capitalize ${activeReport === r ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
							{r}
						</button>
					))}
				</div>

				{/* Filters (still generic) */}
				{/* <div className="flex space-x-4 mb-6">
					<input type="date" className="border p-2 rounded" />
					<input type="date" className="border p-2 rounded" />
					<select className="border p-2 rounded">
						<option>All</option>
						<option>Active</option>
						<option>Overdue</option>
						<option>Returned</option>
					</select>
				</div> */}

				{/* Actions */}
				<div className="flex justify-end mb-4 space-x-3">
					<button onClick={() => handleDownload("csv")} className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-100">
						<FileDown className="w-4 h-4 mr-2" /> Export CSV
					</button>
					<button onClick={() => handleDownload("pdf")} className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-100">
						<FileDown className="w-4 h-4 mr-2" /> Export PDF
					</button>
					<button onClick={handlePrint} className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-100">
						<Printer className="w-4 h-4 mr-2" /> Print
					</button>
				</div>

				{/* Table */}
				<div className="overflow-x-auto border rounded-lg">
					{loading ? (
						<p className="p-4">Loading {activeReport}...</p>
					) : activeReport === "fines" ? (
						// Fine Reports Content
						<div className="p-6">
							{/* Summary Cards */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-blue-100 rounded-lg">
											<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
											</svg>
										</div>
										<div className="ml-4">
											<h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
											<p className="text-2xl font-bold text-gray-900">{fineSummary.totalAmount || 0} NOK</p>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-green-100 rounded-lg">
											<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<div className="ml-4">
											<h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
											<p className="text-2xl font-bold text-gray-900">{fineSummary.totalPayments || 0}</p>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-purple-100 rounded-lg">
											<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
											</svg>
										</div>
										<div className="ml-4">
											<h3 className="text-sm font-medium text-gray-500">Unique Users</h3>
											<p className="text-2xl font-bold text-gray-900">{fineSummary.uniqueUsers || 0}</p>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
											</svg>
										</div>
										<div className="ml-4">
											<h3 className="text-sm font-medium text-gray-500">Average Payment</h3>
											<p className="text-2xl font-bold text-gray-900">{Math.round(fineSummary.averagePayment || 0)} NOK</p>
										</div>
									</div>
								</div>
							</div>

							{/* Filter Controls */}
							<div className="bg-white rounded-lg shadow mb-6">
								<div className="p-6 border-b border-gray-200">
									<h2 className="text-lg font-semibold mb-4">Payment History</h2>
									<div className="flex space-x-4">
										{[
											{ key: "all", label: "All Time" },
											{ key: "today", label: "Today" },
											{ key: "week", label: "Last Week" },
											{ key: "month", label: "Last Month" },
										].map((option) => (
											<button key={option.key} onClick={() => setFineFilter(option.key)} className={`px-4 py-2 rounded-lg text-sm font-medium ${fineFilter === option.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
												{option.label}
											</button>
										))}
									</div>
									{fineFilter !== "all" && (
										<div className="mt-4 p-3 bg-blue-50 rounded-lg">
											<p className="text-sm text-blue-800">
												<strong>Filtered Results:</strong> {filteredPayments.length} payments totaling {filteredTotal} NOK
											</p>
										</div>
									)}
								</div>

								{/* Payment Table */}
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{filteredPayments.length === 0 ? (
												<tr>
													<td colSpan={6} className="text-center py-8 text-gray-400">
														No payments found for the selected period.
													</td>
												</tr>
											) : (
												filteredPayments.map((payment) => (
													<tr key={payment.id} className="hover:bg-gray-50">
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{new Date(payment.paidAt).toLocaleDateString()} at {new Date(payment.paidAt).toLocaleTimeString()}
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="text-sm font-medium text-gray-900">{payment.user.name || "N/A"}</div>
															<div className="text-sm text-gray-500">{payment.user.email}</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="text-sm font-medium text-gray-900">{payment.transaction.book.title}</div>
															<div className="text-sm text-gray-500">by {payment.transaction.book.author}</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{payment.amount} NOK</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.processedBy || "N/A"}</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.notes || "-"}</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					) : data.length === 0 ? (
						<div className="p-6 text-center">
							{activeReport === "defaulters" ? (
								<div className="bg-green-50 border border-green-200 rounded-lg p-4">
									<div className="text-green-700 font-medium text-lg mb-2">🎉 Great News!</div>
									<p className="text-green-600">No defaulters found. All books are returned on time or within the deadline.</p>
								</div>
							) : (
								<p className="text-gray-500">No {activeReport} found.</p>
							)}
						</div>
					) : (
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-gray-100">
									{(activeReport === "users" || activeReport === "books" || activeReport === "issues" || activeReport === "returns" || activeReport === "defaulters") && <th className="p-3 border font-medium text-gray-700">S.N.</th>}
									{activeReport === "issues"
										? getIssuesColumnOrder(data).map((key) => (
												<th key={key} className="p-3 border font-medium text-gray-700">
													{getHeaderLabel(key, activeReport)}
												</th>
										  ))
										: activeReport === "returns"
										? getReturnsColumnOrder(data).map((key) => (
												<th key={key} className="p-3 border font-medium text-gray-700">
													{getHeaderLabel(key, activeReport)}
												</th>
										  ))
										: activeReport === "defaulters"
										? getDefaultersColumnOrder(data).map((key) => (
												<th key={key} className="p-3 border font-medium text-gray-700">
													{getHeaderLabel(key, activeReport)}
												</th>
										  ))
										: Object.keys(data[0])
												.filter((key, index, arr) => {
													if (activeReport === "books") return key !== "id" && index !== arr.length - 1;
													if (activeReport === "users") return key !== "id";
													return true;
												})
												.map((key) => (
													<th key={key} className="p-3 border font-medium text-gray-700">
														{getHeaderLabel(key, activeReport)}
													</th>
												))}
								</tr>
							</thead>
							<tbody>
								{data.map((row, i) => (
									<tr key={i} className="hover:bg-gray-50">
										{(activeReport === "users" || activeReport === "books" || activeReport === "issues" || activeReport === "returns" || activeReport === "defaulters") && <td className="p-3 border font-medium">{i + 1}</td>}
										{activeReport === "issues"
											? getIssuesColumnOrder(data).map((key, j) => (
													<td key={j} className="p-3 border">
														{formatCellValue(key, row[key], activeReport)}
													</td>
											  ))
											: activeReport === "returns"
											? getReturnsColumnOrder(data).map((key, j) => (
													<td key={j} className="p-3 border">
														{formatCellValue(key, row[key], activeReport)}
													</td>
											  ))
											: activeReport === "defaulters"
											? getDefaultersColumnOrder(data).map((key, j) => (
													<td key={j} className="p-3 border">
														{formatCellValue(key, row[key], activeReport)}
													</td>
											  ))
											: Object.entries(row)
													.filter(([key, val], index, arr) => {
														if (activeReport === "books") return key !== "id" && index !== arr.length - 1;
														if (activeReport === "users") return key !== "id";
														return true;
													})
													.map(([key, val], j) => (
														<td key={j} className="p-3 border">
															{formatCellValue(key, val, activeReport)}
														</td>
													))}
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}
