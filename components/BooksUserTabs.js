"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

const TABS = [
	{ key: "overview", label: "Overview", shortLabel: "Overview" },
	{ key: "membership", label: "Membership Card", shortLabel: "Card" },
	{ key: "borrowed", label: "Borrowed", shortLabel: "Borrowed" },
	{ key: "returned", label: "Returned", shortLabel: "Returned" },
	{ key: "fines", label: "Fine History", shortLabel: "Fines" },
	{ key: "password", label: "Change Password", shortLabel: "Password" },
];

export default function BooksUserTabs() {
	const { data: session } = useSession();
	const [activeTab, setActiveTab] = useState("overview");
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");

	// Password change state
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		isSubmitting: false,
		message: "",
		messageType: "info", // "success", "error", "info"
	});

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

	// Password change handler
	const handlePasswordChangeRequest = async (e) => {
		e.preventDefault();
		setPasswordForm((prev) => ({ ...prev, isSubmitting: true, message: "", messageType: "info" }));

		try {
			const response = await fetch("/api/auth/request-password-change", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: session.user.email,
					currentPassword: passwordForm.currentPassword,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				setPasswordForm((prev) => ({
					...prev,
					currentPassword: "",
					message: "Password change link has been sent to your email. Please check your inbox.",
					messageType: "success",
				}));
			} else {
				setPasswordForm((prev) => ({
					...prev,
					message: result.error || "Failed to request password change",
					messageType: "error",
				}));
			}
		} catch (error) {
			setPasswordForm((prev) => ({
				...prev,
				message: "Network error. Please try again.",
				messageType: "error",
			}));
		} finally {
			setPasswordForm((prev) => ({ ...prev, isSubmitting: false }));
		}
	};

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
										<Image src={qrCodeUrl} alt="Membership QR Code" width={150} height={150} className="mx-auto mb-2" style={{ maxWidth: "150px", height: "auto" }} />
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

	const renderPasswordChange = () => (
		<div className="p-4">
			<h2 className="text-lg font-bold mb-4">Change Password</h2>
			<div className="max-w-md mx-auto">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
					<ol className="text-sm text-blue-700 space-y-1">
						<li>1. Enter your current password</li>
						<li>2. Click &quot;Request Password Change&quot;</li>
						<li>3. Check your email for the change link</li>
						<li>4. Follow the link to set your new password</li>
						<li>5. Receive confirmation email</li>
					</ol>
				</div>

				<form onSubmit={handlePasswordChangeRequest} className="space-y-4">
					<div>
						<label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
							Current Password
						</label>
						<input type="password" id="currentPassword" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your current password" required disabled={passwordForm.isSubmitting} />
					</div>

					{passwordForm.message && <div className={`p-3 rounded-md text-sm ${passwordForm.messageType === "success" ? "bg-green-50 text-green-700 border border-green-200" : passwordForm.messageType === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>{passwordForm.message}</div>}

					<button type="submit" disabled={passwordForm.isSubmitting || !passwordForm.currentPassword} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition duration-200">
						{passwordForm.isSubmitting ? (
							<span className="flex items-center justify-center">
								<svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Sending Email...
							</span>
						) : (
							"Request Password Change"
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-xs text-gray-500">The password change link will be valid for 1 hour. If you don&apos;t receive the email, please check your spam folder.</p>
				</div>
			</div>
		</div>
	);

	return (
		<div className="mb-8">
			{/* Mobile-friendly horizontal scrollable tabs */}
			<div className="relative">
				<div className="flex gap-1 mb-4 border-b pb-2 overflow-x-auto scrollbar-hide">
					<div className="flex gap-1 min-w-max px-1">
						{TABS.map((tab) => (
							<button
								key={tab.key}
								className={`
									px-3 py-2 rounded-t-lg font-medium focus:outline-none transition border-b-2 whitespace-nowrap text-sm min-w-0 flex-shrink-0
									${activeTab === tab.key ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300"}
									sm:px-4 sm:py-3 sm:text-base sm:min-w-0
									touch-manipulation select-none
								`}
								onClick={() => setActiveTab(tab.key)}
							>
								{/* Show short label on mobile, full label on larger screens */}
								<span className="block sm:hidden">{tab.shortLabel}</span>
								<span className="hidden sm:block">{tab.label}</span>
							</button>
						))}
					</div>
				</div>
				{/* Scroll indicator shadows */}
				<div className="absolute left-0 top-0 bottom-4 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none sm:hidden z-10"></div>
				<div className="absolute right-0 top-0 bottom-4 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden z-10"></div>
			</div>
			<div className="bg-white rounded-lg shadow p-4">
				{activeTab === "overview" && renderOverview()}
				{activeTab === "membership" && renderMembershipCard()}
				{activeTab === "borrowed" && renderBorrowed()}
				{activeTab === "returned" && renderReturned()}
				{activeTab === "fines" && renderFines()}
				{activeTab === "password" && renderPasswordChange()}
			</div>
		</div>
	);
}
