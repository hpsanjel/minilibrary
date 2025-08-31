"use client";
import { useState, useEffect } from "react";
import { FileDown, Printer } from "lucide-react";

export default function ReportsPage() {
	const [activeReport, setActiveReport] = useState("users");
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);

	const reports = ["users", "books", "issues", "returns", "defaulters"];

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
					<p className="p-4">No {activeReport} found.</p>
				) : (
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-100">
								{Object.keys(data[0]).map((key) => (
									<th key={key} className="p-3 border capitalize">
										{key}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.map((row, i) => (
								<tr key={i} className="hover:bg-gray-50">
									{Object.values(row).map((val, j) => (
										<td key={j} className="p-3 border">
											{val ?? "-"}
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
