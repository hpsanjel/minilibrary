"use client";
import ConfirmationModal from "@/components/ConfirmationModal";
import UserDeletionModal from "@/components/UserDeletionModal";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [modalMode, setModalMode] = useState("edit"); // "edit" or "add"
	const [form, setForm] = useState({ id: null, name: "", email: "", password: "", phone: "", city: "", postalCode: "", address: "", role: "STUDENT" });
	const [verifyingUsers, setVerifyingUsers] = useState(new Set()); // Track users being verified

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
				fetchUsers(); // refresh list
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

	useEffect(() => {
		fetchUsers();
	}, []);

	const openEditModal = (user) => {
		setForm({ ...user });
		setModalMode("edit");
		setShowModal(true);
	};

	const openAddModal = () => {
		setForm({ id: null, name: "", email: "", password: "", phone: "", city: "", postalCode: "", address: "", role: "STUDENT" });
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
			await fetch("/api/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: form.id,
					name: form.name,
					phone: form.phone,
					city: form.city,
					postalCode: form.postalCode,
					address: form.address,
					role: form.role,
					verifiedUser: form.verifiedUser,
				}),
			});
			setShowModal(false);
			fetchUsers();
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

	return (
		<div className="p-6">
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
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
							{/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Postal Code</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th> */}
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
							<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{loading ? (
							<tr>
								<td colSpan={9} className="text-center py-8 text-gray-400">
									Loading...
								</td>
							</tr>
						) : users.length === 0 ? (
							<tr>
								<td colSpan={9} className="text-center py-8 text-gray-400">
									No users found.
								</td>
							</tr>
						) : (
							users.map((user) => (
								<tr key={user.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{user.name || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{user.phone || "-"}</td>
									{/* <td className="px-6 py-4 whitespace-nowrap text-sm">{user.city || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{user.postalCode || "-"}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">{user.address || "-"}</td> */}
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span className={`px-2 py-1 rounded text-xs font-medium ${user.role === "ADMIN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{user.role}</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span className={`px-2 py-1 rounded text-xs font-medium ${user.verifiedUser === "Yes" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.verifiedUser}</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-center text-sm flex gap-2">
										<button onClick={() => openEditModal(user)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow text-xs">
											Edit
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

			{/* Modal for Add/Edit User */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
					<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
						<h2 className="text-xl font-bold mb-4">{modalMode === "add" ? "Add New User" : "Edit User"}</h2>
						<form onSubmit={handleSubmit} className="flex flex-col gap-3">
							<input type="text" placeholder="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 rounded" required />
							<input type="email" placeholder="Email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`border p-2 rounded ${modalMode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""}`} disabled={modalMode === "edit"} required={modalMode === "add"} />
							{modalMode === "add" && <input type="password" placeholder="Password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border p-2 rounded" required />}
							<input type="text" placeholder="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border p-2 rounded" />
							<input type="text" placeholder="City" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border p-2 rounded" />
							<input type="text" placeholder="Postal Code" value={form.postalCode || ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="border p-2 rounded" />
							<input type="text" placeholder="Address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border p-2 rounded" />
							<label className="flex items-center gap-2">
								<span>Role:</span>
								<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border p-2 rounded">
									<option value="ADMIN">ADMIN</option>
									<option value="STUDENT">STUDENT</option>
								</select>
							</label>
							{modalMode === "edit" && (
								<label className="flex items-center gap-2">
									<span>Verified:</span>
									<select value={form.verifiedUser || "No"} onChange={(e) => setForm({ ...form, verifiedUser: e.target.value })} className="border p-2 rounded">
										<option value="No">No</option>
										<option value="Yes">Yes</option>
									</select>
								</label>
							)}
							<div className="flex gap-2 mt-4">
								<button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
									{modalMode === "add" ? "Create User" : "Update User"}
								</button>
								<button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded shadow">
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* User Deletion Modal */}
			<UserDeletionModal isOpen={isUserDeletionModalOpen} onClose={() => setIsUserDeletionModalOpen(false)} onConfirm={handleDelete} user={selectedUserForDeletion} />
		</div>
	);
}
