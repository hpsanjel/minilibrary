"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const TABS = [
	{ key: "overview", label: "Overview" },
	{ key: "membership", label: "Membership Card" },
	{ key: "borrowed", label: "Borrowed" },
	{ key: "returned", label: "Returned" },
	{ key: "fines", label: "Fine History" },
];

export default function BooksUserTabs() {
	const { data: session } = useSession();
	const [activeTab, setActiveTab] = useState("overview");
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");

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

	// Generate QR code for membership number
	useEffect(() => {
		if (!session?.user?.membershipNumber) return;

		QRCode.toDataURL(session.user.membershipNumber, {
			width: 200,
			margin: 2,
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		})
			.then((url) => setQrCodeUrl(url))
			.catch((err) => console.error("QR Code generation error:", err));
	}, [session?.user?.membershipNumber]);

	if (!session) return null;

	// Tab content renderers
	const renderOverview = () => {
		const totalBorrowed = transactions.length;
		const currentlyBorrowed = transactions.filter((t) => !t.returned).length;
		const totalFines = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);
		return (
			<div className="p-4">
				<h2 className="text-lg font-bold mb-4">Account Overview</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="bg-blue-100 border-blue-300 border rounded-lg p-4 flex flex-col items-center shadow-sm">
						<span className="text-3xl font-bold text-blue-700 mb-1">{totalBorrowed}</span>
						<span className="text-sm text-blue-800 font-medium">Total Borrowed</span>
					</div>
					<div className="bg-green-100 border-green-300 border rounded-lg p-4 flex flex-col items-center shadow-sm">
						<span className="text-3xl font-bold text-green-700 mb-1">{currentlyBorrowed}</span>
						<span className="text-sm text-green-800 font-medium">Currently Borrowed</span>
					</div>
					<div className="bg-yellow-100 border-yellow-300 border rounded-lg p-4 flex flex-col items-center shadow-sm">
						<span className="text-3xl font-bold text-yellow-700 mb-1">
							{totalFines} <span className="text-base font-normal">NOK</span>
						</span>
						<span className="text-sm text-yellow-800 font-medium">Total Fines</span>
					</div>
				</div>
			</div>
		);
	};

	const renderMembershipCard = () => (
		<div className="p-4">
			{/* <h2 className="text-lg font-bold mb-4">Library Membership Card</h2> */}
			<div className="max-w-md mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg overflow-hidden">
				{/* Card Header */}
				<div className="bg-blue-700 px-6 py-4 text-center">
					<h3 className="text-white text-lg font-bold">Mini Library</h3>
					<p className="text-blue-200 text-sm">Membership Card</p>
				</div>

				{/* Card Body */}
				<div className="bg-white p-6">
					{/* User Info */}
					<div className="text-center mb-4">
						{/* <p className="text-gray-600 text-sm mb-2">{session?.user?.email}</p> */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4">
							<h4 className="text-lg font-bold text-gray-800 mb-1">{session?.user?.name || "Library Member"}</h4>
							{/* <p className="text-xs text-gray-500 mb-1">Membership Number</p> */}
							<p className="text-blue-700 font-mono font-bold text-lg">{session?.user?.membershipNumber || "Loading..."}</p>
							{/* QR Code */}
							<div className="text-center">
								{qrCodeUrl ? (
									<div className="bg-gray-50 rounded-lg p-4">
										<img src={qrCodeUrl} alt="Membership QR Code" className="mx-auto mb-2" style={{ maxWidth: "150px", height: "auto" }} />
										<p className="text-xs text-gray-500">Scan for quick identification</p>
									</div>
								) : (
									<div className="bg-gray-50 rounded-lg p-4">
										<div className="w-32 h-32 mx-auto bg-gray-200 rounded flex items-center justify-center">
											<p className="text-gray-500 text-sm">Loading QR Code...</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Card Footer */}
				<div className="bg-blue-700 px-6 py-3 text-center">
					<p className="text-blue-200 text-xs">Present this card for library services</p>
				</div>
			</div>
		</div>
	);

	const renderBorrowed = () => (
		<div className="overflow-x-auto">
			<h2 className="text-lg font-bold mb-2">Borrowed Books</h2>
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Borrowed At</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fine</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{transactions.filter((t) => !t.returned).length === 0 ? (
						<tr>
							<td colSpan={4} className="text-center text-gray-400 py-4">
								No borrowed books.
							</td>
						</tr>
					) : (
						transactions
							.filter((t) => !t.returned)
							.map((t) => (
								<tr key={t.id}>
									<td className="px-4 py-2">{t.book?.title || "-"}</td>
									<td className="px-4 py-2">{new Date(t.createdAt).toLocaleDateString()}</td>
									<td className="px-4 py-2">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "-"}</td>
									<td className="px-4 py-2">{t.fine || 0}</td>
								</tr>
							))
					)}
				</tbody>
			</table>
		</div>
	);

	const renderReturned = () => (
		<div className="overflow-x-auto">
			<h2 className="text-lg font-bold mb-2">Returned Books</h2>
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Returned At</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fine</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{transactions.filter((t) => t.returned).length === 0 ? (
						<tr>
							<td colSpan={3} className="text-center text-gray-400 py-4">
								No returned books.
							</td>
						</tr>
					) : (
						transactions
							.filter((t) => t.returned)
							.map((t) => (
								<tr key={t.id}>
									<td className="px-4 py-2">{t.book?.title || "-"}</td>
									<td className="px-4 py-2">{t.returnedAt ? new Date(t.returnedAt).toLocaleDateString() : "-"}</td>
									<td className="px-4 py-2">{t.fine || 0}</td>
								</tr>
							))
					)}
				</tbody>
			</table>
		</div>
	);

	const renderFines = () => (
		<div className="overflow-x-auto">
			<h2 className="text-lg font-bold mb-2">Fine History</h2>
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fine</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
						<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Returned At</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{transactions.filter((t) => t.fine && t.fine > 0).length === 0 ? (
						<tr>
							<td colSpan={4} className="text-center text-gray-400 py-4">
								No fines found.
							</td>
						</tr>
					) : (
						transactions
							.filter((t) => t.fine && t.fine > 0)
							.map((t) => (
								<tr key={t.id}>
									<td className="px-4 py-2">{t.book?.title || "-"}</td>
									<td className="px-4 py-2">{t.fine}</td>
									<td className="px-4 py-2">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "-"}</td>
									<td className="px-4 py-2">{t.returnedAt ? new Date(t.returnedAt).toLocaleDateString() : "-"}</td>
								</tr>
							))
					)}
				</tbody>
			</table>
		</div>
	);

	return (
		<div className="mb-8">
			<div className="flex gap-2 mb-4 border-b pb-2">
				{TABS.map((tab) => (
					<button key={tab.key} className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none transition border-b-2 ${activeTab === tab.key ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200"}`} onClick={() => setActiveTab(tab.key)}>
						{tab.label}
					</button>
				))}
			</div>
			<div className="bg-white rounded-lg shadow p-4">
				{activeTab === "overview" && renderOverview()}
				{activeTab === "membership" && renderMembershipCard()}
				{activeTab === "borrowed" && renderBorrowed()}
				{activeTab === "returned" && renderReturned()}
				{activeTab === "fines" && renderFines()}
			</div>
		</div>
	);
}
