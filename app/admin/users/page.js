"use client";
import ConfirmationModal from "@/components/ConfirmationModal";
import UserDeletionModal from "@/components/UserDeletionModal";
import PhotoUpload from "@/components/PhotoUpload";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, BookOpen, Clock, DollarSign, CheckCircle, XCircle, Edit, Trash2, Calendar, AlertTriangle, Key } from "lucide-react";

export default function AdminUsersPage() {
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [userTransactions, setUserTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [modalMode, setModalMode] = useState("edit"); // "edit" or "add"
	const [form, setForm] = useState({ id: null, name: "", email: "", password: "", phone: "", city: "", postalCode: "", address: "", photo: "", role: "STUDENT" });
	const [verifyingUsers, setVerifyingUsers] = useState(new Set()); // Track users being verified
	const [resettingPasswords, setResettingPasswords] = useState(new Set()); // Track users having password reset

	const searchParams = useSearchParams();
	const router = useRouter();
	const userId = searchParams.get("id");

	const [isUserDeletionModalOpen, setIsUserDeletionModalOpen] = useState(false);
	const [selectedUserForDeletion, setSelectedUserForDeletion] = useState(null);

	const openDeleteModal = (user) => {
		setSelectedUserForDeletion(user);
		setIsUserDeletionModalOpen(true);
	};

	const handleDelete = async () => {
		if (!selectedUserForDeletion) return;

		try {
			const response = await fetch("/api/users", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: selectedUserForDeletion.id }),
			});

			const result = await response.json();

			if (response.ok) {
				setIsUserDeletionModalOpen(false);
				setSelectedUserForDeletion(null);

				// If we're on a detail page and deleting that user, redirect to list
				if (userId && selectedUserForDeletion.id.toString() === userId) {
					router.push("/admin/users");
				} else {
					fetchUsers(); // refresh list
				}
			} else {
				console.error("Failed to delete user:", result.error);
				alert(result.error || "Failed to delete user");
			}
		} catch (error) {
			console.error("Error deleting user:", error);
			alert("Failed to delete user. Please try again.");
		}
	};

	const fetchUsers = async () => {
		setLoading(true);
		const res = await fetch("/api/users");
		const data = await res.json();
		setUsers(data);
		setLoading(false);
	};

	const fetchUserDetails = async (id) => {
		setLoading(true);
		try {
			// Fetch user details
			const userRes = await fetch(`/api/users?id=${id}`);
			const userData = await userRes.json();

			// Fetch user transactions
			const transRes = await fetch(`/api/transactions?userId=${id}`);
			const transData = await transRes.json();

			setSelectedUser(userData);
			setUserTransactions(transData);
		} catch (error) {
			console.error("Error fetching user details:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (userId) {
			fetchUserDetails(userId);
		} else {
			fetchUsers();
		}
	}, [userId]);

	const openEditModal = (user) => {
		setForm({
			...user,
			photo: user.photo || "", // Ensure photo is always a string
		});
		setModalMode("edit");
		setShowModal(true);
	};

	const openAddModal = () => {
		setForm({ id: null, name: "", email: "", password: "", phone: "", city: "", postalCode: "", address: "", photo: "", role: "STUDENT" });
		setModalMode("add");
		setShowModal(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (modalMode === "add") {
			// Create new user
			const response = await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: form.name,
					email: form.email,
					password: form.password,
					phone: form.phone,
					city: form.city,
					postalCode: form.postalCode,
					address: form.address,
					photo: form.photo,
					role: form.role,
				}),
			});

			if (response.ok) {
				setShowModal(false);
				fetchUsers();
			} else {
				const error = await response.json();
				alert(error.error || "Failed to create user");
			}
		} else {
			// Edit existing user
			const response = await fetch("/api/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: form.id,
					name: form.name,
					phone: form.phone,
					city: form.city,
					postalCode: form.postalCode,
					address: form.address,
					photo: form.photo,
					role: form.role,
					verifiedUser: form.verifiedUser,
				}),
			});

			if (response.ok) {
				setShowModal(false);
				// If we're on a detail page, refresh the detail view
				if (userId) {
					fetchUserDetails(userId);
				} else {
					fetchUsers();
				}
			} else {
				const error = await response.json();
				console.error("Failed to update user:", error);
				alert(error.error || "Failed to update user");
			}
		}
	};

	// const handleDelete = async (id) => {
	// 	if (!confirm("Are you sure you want to delete this user?")) return;
	// 	await fetch("/api/users", {
	// 		method: "DELETE",
	// 		body: JSON.stringify({ id }),
	// 	});
	// 	fetchUsers();
	// };

	// ...existing code...
	// Add verify handler
	const handleVerify = async (id) => {
		// Add user ID to verifying set
		setVerifyingUsers((prev) => new Set([...prev, id]));

		try {
			await fetch("/api/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, verifiedUser: "Yes" }),
			});
			fetchUsers();
		} catch (error) {
			console.error("Failed to verify user:", error);
		} finally {
			// Remove user ID from verifying set
			setVerifyingUsers((prev) => {
				const newSet = new Set(prev);
				newSet.delete(id);
				return newSet;
			});
		}
	};

	// Add password reset handler
	const handleResetPassword = async (id) => {
		if (!confirm("Are you sure you want to reset this user's password to 'password'?")) return;

		// Add user ID to resetting set
		setResettingPasswords((prev) => new Set([...prev, id]));

		try {
			const response = await fetch("/api/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, resetPassword: true }),
			});

			if (response.ok) {
				alert("Password reset successfully! New password is 'password'");
				// If we're on a detail page, refresh the detail view
				if (userId) {
					fetchUserDetails(userId);
				} else {
					fetchUsers();
				}
			} else {
				const error = await response.json();
				alert(error.error || "Failed to reset password");
			}
		} catch (error) {
			console.error("Failed to reset password:", error);
			alert("Failed to reset password");
		} finally {
			// Remove user ID from resetting set
			setResettingPasswords((prev) => {
				const newSet = new Set(prev);
				newSet.delete(id);
				return newSet;
			});
		}
	};

	return (
		<div className="p-6">
			{userId && selectedUser ? (
				// Detailed User View
				<UserDetailView user={selectedUser} transactions={userTransactions} loading={loading} onBack={() => router.push("/admin/users")} onEdit={() => openEditModal(selectedUser)} onDelete={() => openDeleteModal(selectedUser)} onResetPassword={() => handleResetPassword(selectedUser.id)} isResettingPassword={resettingPasswords.has(selectedUser.id)} />
			) : (
				// Users List View
				<>
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-2xl font-bold">Users</h1>
						<button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add New User
						</button>
					</div>
					<div className="overflow-x-auto rounded-lg shadow border bg-white">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership #</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
									{/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Postal Code</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th> */}
									{/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th> */}
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{loading ? (
									<tr>
										<td colSpan={8} className="text-center py-8 text-gray-400">
											Loading...
										</td>
									</tr>
								) : users.length === 0 ? (
									<tr>
										<td colSpan={8} className="text-center py-8 text-gray-400">
											No users found.
										</td>
									</tr>
								) : (
									users.map((user) => (
										<tr key={user.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-semibold">{user.membershipNumber || "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="w-10 h-10 rounded-full overflow-hidden">
													{user.photo ? (
														<img src={user.photo} alt={`${user.name}'s profile`} className="w-full h-full object-cover" />
													) : (
														<div className="w-full h-full bg-gray-200 flex items-center justify-center">
															<User className="w-5 h-5 text-gray-500" />
														</div>
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{user.name || "-"}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">{user.phone || "-"}</td>
											{/* <td className="px-6 py-4 whitespace-nowrap text-sm">{user.city || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{user.postalCode || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{user.address || "-"}</td> */}
											{/* <td className="px-6 py-4 whitespace-nowrap text-sm">
												<span className={`px-2 py-1 rounded text-xs font-medium ${user.role === "ADMIN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{user.role}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												<span className={`px-2 py-1 rounded text-xs font-medium ${user.verifiedUser === "Yes" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.verifiedUser}</span>
											</td> */}
											<td className="px-6 py-4 whitespace-nowrap text-center text-sm flex gap-2">
												<button onClick={() => openEditModal(user)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow text-xs">
													Edit
												</button>
												<button onClick={() => handleResetPassword(user.id)} disabled={resettingPasswords.has(user.id)} className={`px-3 py-1 rounded shadow text-xs flex items-center gap-1 ${resettingPasswords.has(user.id) ? "bg-gray-400 text-white cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
													{resettingPasswords.has(user.id) ? (
														<>
															<svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															Resetting...
														</>
													) : (
														"Reset Pwd"
													)}
												</button>
												<button onClick={() => openDeleteModal(user)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-xs">
													Delete
												</button>
												{user.verifiedUser !== "Yes" && (
													<button onClick={() => handleVerify(user.id)} disabled={verifyingUsers.has(user.id)} className={`px-3 py-1 rounded shadow text-xs flex items-center gap-1 ${verifyingUsers.has(user.id) ? "bg-gray-400 text-white cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"}`}>
														{verifyingUsers.has(user.id) ? (
															<>
																<svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
																	<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
																	<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																</svg>
																Verifying...
															</>
														) : (
															"Verify"
														)}
													</button>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* User Deletion Modal */}
					<UserDeletionModal isOpen={isUserDeletionModalOpen} onClose={() => setIsUserDeletionModalOpen(false)} onConfirm={handleDelete} user={selectedUserForDeletion} />
				</>
			)}

			{/* Modal for Add/Edit User - Always available */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
						<div className="p-6 border-b border-gray-100">
							<h2 className="text-xl font-bold text-gray-900">{modalMode === "add" ? "Add New User" : "Edit User"}</h2>
						</div>

						<form onSubmit={handleSubmit} className="p-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Left Column - Personal Info */}
								<div className="space-y-4">
									<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Personal Information</h3>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
										<input type="text" placeholder="John Doe" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" required />
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
										<input type="email" placeholder="john@example.com" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`w-full border border-gray-300 p-2 rounded-lg outline-none transition ${modalMode === "edit" ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}`} disabled={modalMode === "edit"} required={modalMode === "add"} />
									</div>

									{modalMode === "add" && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
											<input type="password" placeholder="••••••••" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" required />
										</div>
									)}

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
										<input type="text" placeholder="+1 234 567 890" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
									</div>

									<div className="pt-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">Role & Status</label>
										<div className="grid grid-cols-2 gap-4">
											<label className="flex flex-col gap-1">
												<span className="text-xs text-gray-500">Role</span>
												<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
													<option value="ADMIN">Admin</option>
													<option value="STUDENT">Student</option>
												</select>
											</label>

											{modalMode === "edit" && (
												<label className="flex flex-col gap-1">
													<span className="text-xs text-gray-500">Verified</span>
													<select value={form.verifiedUser || "No"} onChange={(e) => setForm({ ...form, verifiedUser: e.target.value })} className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
														<option value="No">No</option>
														<option value="Yes">Yes</option>
													</select>
												</label>
											)}
										</div>
									</div>
								</div>

								{/* Right Column - Address & Photo */}
								<div className="space-y-4">
									<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Address & Photo</h3>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">City</label>
											<input type="text" placeholder="New York" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
											<input type="text" placeholder="10001" value={form.postalCode || ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
										<input type="text" placeholder="123 Main St, Apt 4B" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
									</div>

									<div className="pt-2">
										<PhotoUpload photo={form.photo || ""} setPhoto={(photo) => setForm({ ...form, photo })} />
									</div>
								</div>
							</div>

							<div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
								<button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
									Cancel
								</button>
								<button type="submit" className="px-5 py-2.5 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
									{modalMode === "add" ? "Create User" : "Save Changes"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* User Deletion Modal - Always available */}
			<UserDeletionModal isOpen={isUserDeletionModalOpen} onClose={() => setIsUserDeletionModalOpen(false)} onConfirm={handleDelete} user={selectedUserForDeletion} />
		</div>
	);
}

// User Detail View Component
function UserDetailView({ user, transactions, loading, onBack, onEdit, onDelete, onResetPassword, isResettingPassword }) {
	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const activeTransactions = transactions.filter((t) => !t.returned);
	const completedTransactions = transactions.filter((t) => t.returned);
	const totalFines = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);
	const overduebooks = activeTransactions.filter((t) => t.deadline && new Date(t.deadline) < new Date());

	return (
		<div className="max-w-6xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
						<ArrowLeft className="w-5 h-5" />
					</button>
					<h1 className="text-3xl font-bold text-gray-900">User Details</h1>
				</div>
				<div className="flex gap-3">
					<button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
						<Edit className="w-4 h-4" />
						Edit User
					</button>
					<button onClick={onResetPassword} disabled={isResettingPassword} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
						{isResettingPassword ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Key className="w-4 h-4" />}
						{isResettingPassword ? "Resetting..." : "Reset Password"}
					</button>
					<button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
						<Trash2 className="w-4 h-4" />
						Delete User
					</button>
				</div>
			</div>

			{/* User Info Card */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div className="flex items-start gap-6">
					<div className="w-20 h-20 rounded-full flex-shrink-0 overflow-hidden">
						{user.photo ? (
							<img src={user.photo} alt={`${user.name}'s profile`} className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full bg-blue-100 flex items-center justify-center">
								<User className="w-10 h-10 text-blue-600" />
							</div>
						)}
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-4 mb-4">
							<h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
							<span className={`px-3 py-1 rounded-full text-sm font-medium ${user.verifiedUser === "Yes" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{user.verifiedUser === "Yes" ? "Verified" : "Pending Verification"}</span>
							<span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>{user.role}</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<div className="flex items-center gap-2">
								<CreditCard className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">Membership:</span>
								<span className="font-mono text-sm">{user.membershipNumber || "Not assigned"}</span>
							</div>
							<div className="flex items-center gap-2">
								<Mail className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">Email:</span>
								<span className="text-sm">{user.email}</span>
							</div>
							{user.phone && (
								<div className="flex items-center gap-2">
									<Phone className="w-4 h-4 text-gray-500" />
									<span className="text-sm text-gray-600">Phone:</span>
									<span className="text-sm">{user.phone}</span>
								</div>
							)}
							{user.city && (
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4 text-gray-500" />
									<span className="text-sm text-gray-600">City:</span>
									<span className="text-sm">{user.city}</span>
								</div>
							)}
							{user.postalCode && (
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4 text-gray-500" />
									<span className="text-sm text-gray-600">Postal Code:</span>
									<span className="text-sm">{user.postalCode}</span>
								</div>
							)}
							{user.address && (
								<div className="flex items-center gap-2 col-span-full">
									<MapPin className="w-4 h-4 text-gray-500" />
									<span className="text-sm text-gray-600">Address:</span>
									<span className="text-sm">{user.address}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
				<StatCard title="Currently Borrowed" value={activeTransactions.length} icon={<BookOpen className="w-6 h-6" />} color="from-blue-400 to-blue-600" />
				<StatCard title="Total Borrowed" value={transactions.length} icon={<BookOpen className="w-6 h-6" />} color="from-green-400 to-green-600" />
				<StatCard title="Overdue Books" value={overduebooks.length} icon={<AlertTriangle className="w-6 h-6" />} color="from-red-400 to-red-600" />
				<StatCard title="Total Fines" value={`$${(totalFines / 100).toFixed(2)}`} icon={<DollarSign className="w-6 h-6" />} color="from-orange-400 to-orange-600" />
			</div>

			{/* Current Borrowings */}
			{activeTransactions.length > 0 && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<BookOpen className="w-5 h-5" />
						Currently Borrowed Books
					</h3>
					<div className="space-y-4">
						{activeTransactions.map((transaction) => (
							<TransactionCard key={transaction.id} transaction={transaction} isActive={true} />
						))}
					</div>
				</div>
			)}

			{/* Transaction History */}
			{completedTransactions.length > 0 && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<Clock className="w-5 h-5" />
						Transaction History
					</h3>
					<div className="space-y-4">
						{completedTransactions.slice(0, 10).map((transaction) => (
							<TransactionCard key={transaction.id} transaction={transaction} isActive={false} />
						))}
						{completedTransactions.length > 10 && <div className="text-center text-gray-500 text-sm">And {completedTransactions.length - 10} more transactions...</div>}
					</div>
				</div>
			)}
		</div>
	);
}

// Statistics Card Component
function StatCard({ title, value, icon, color }) {
	return (
		<div className={`bg-gradient-to-r ${color} rounded-xl shadow p-6 text-white`}>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm opacity-80">{title}</p>
					<p className="text-2xl font-bold">{value}</p>
				</div>
				<div className="bg-white bg-opacity-20 rounded-full p-3">{icon}</div>
			</div>
		</div>
	);
}

// Transaction Card Component
function TransactionCard({ transaction, isActive }) {
	const isOverdue = isActive && transaction.deadline && new Date(transaction.deadline) < new Date();

	return (
		<div className={`border rounded-lg p-4 ${isOverdue ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<h4 className="font-medium text-gray-900">{transaction.Book.title}</h4>
					<p className="text-sm text-gray-600">by {transaction.Book.author}</p>
					{transaction.Book.isbn && <p className="text-xs text-gray-500 font-mono">ISBN: {transaction.Book.isbn}</p>}
				</div>
				<div className="text-right">
					<div className="flex items-center gap-2 mb-1">
						{isActive ? (
							<span className="flex items-center gap-1 text-sm text-blue-600">
								<BookOpen className="w-4 h-4" />
								Currently Borrowed
							</span>
						) : (
							<span className="flex items-center gap-1 text-sm text-green-600">
								<CheckCircle className="w-4 h-4" />
								Returned
							</span>
						)}
					</div>
					<div className="text-xs text-gray-500">
						<div>Borrowed: {new Date(transaction.createdAt).toLocaleDateString()}</div>
						{transaction.deadline && <div className={isOverdue ? "text-red-600 font-medium" : ""}>Due: {new Date(transaction.deadline).toLocaleDateString()}</div>}
						{transaction.returnedAt && <div>Returned: {new Date(transaction.returnedAt).toLocaleDateString()}</div>}
						{transaction.fine > 0 && <div className="text-red-600 font-medium">Fine: ${(transaction.fine / 100).toFixed(2)}</div>}
					</div>
				</div>
			</div>
		</div>
	);
}
