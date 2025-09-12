"use client";
import { useState, useEffect } from "react";
import { FileDown, Printer } from "lucide-react";

export default function ReportsPage() {
	const [activeReport, setActiveReport] = useState("users");
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);

	const reports = ["users", "books", "issues", "returns", "defaulters"];

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
				const res = await fetch(`/api/${activeReport}`);
				if (!res.ok) throw new Error("Failed to fetch report");
				const json = await res.json();
				setData(json);
			} catch (error) {
				console.error("Error fetching report:", error);
				setData([]);
			}
			setLoading(false);
		};
		fetchData();
	}, [activeReport]);

	const handleDownload = (format) => {
		alert(`Downloading ${activeReport} report as ${format}`);
		// TODO: hook this to backend API (PDF/CSV export)
	};

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="p-6">
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
			<div className="flex space-x-4 mb-6">
				<input type="date" className="border p-2 rounded" />
				<input type="date" className="border p-2 rounded" />
				<select className="border p-2 rounded">
					<option>All</option>
					<option>Active</option>
					<option>Overdue</option>
					<option>Returned</option>
				</select>
			</div>

			{/* Table */}
			<div className="overflow-x-auto border rounded-lg">
				{loading ? (
					<p className="p-4">Loading {activeReport}...</p>
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

			{/* Actions */}
			<div className="flex justify-end mt-4 space-x-3">
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
		</div>
	);
}
