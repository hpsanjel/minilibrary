"use client";
import { useState, useEffect } from "react";
import { X, AlertTriangle, Check, DollarSign, BookOpen, User, ChevronDown, ChevronRight } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

export default function UserDeletionModal({ isOpen, onClose, onConfirm, user }) {
	const [userDetails, setUserDetails] = useState(null);
	const [loading, setLoading] = useState(false);
	const [clearingFines, setClearingFines] = useState(false);
	const [finesCleared, setFinesCleared] = useState(false);
	const [step, setStep] = useState(1); // 1: Details, 2: Confirmation
	const [showBorrowDetails, setShowBorrowDetails] = useState(false);
	// Return book functionality
	const [showReturnModal, setShowReturnModal] = useState(false);
	const [pendingReturnTx, setPendingReturnTx] = useState(null);
	const [processingReturns, setProcessingReturns] = useState({});
	const [successReturns, setSuccessReturns] = useState({});

	useEffect(() => {
		if (isOpen && user) {
			fetchUserDetails();
			setFinesCleared(false);
			setStep(1);
			setShowBorrowDetails(false);
			// Reset return-related state
			setProcessingReturns({});
			setSuccessReturns({});
			setShowReturnModal(false);
			setPendingReturnTx(null);
		}
	}, [isOpen, user]);

	const fetchUserDetails = async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/users/${user.id}/details`);
			const data = await response.json();
			setUserDetails(data);
		} catch (error) {
			console.error("Failed to fetch user details:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleClearFines = async () => {
		setClearingFines(true);
		try {
			console.log("Clearing fines for user:", user.id);
			const response = await fetch("/api/transactions", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "clearAllUserFines",
					userId: user.id,
				}),
			});

			const result = await response.json();
			console.log("Clear fines response:", result);

			if (response.ok) {
				setFinesCleared(true);
				console.log("Fines cleared successfully, refreshing user details...");
				// Refresh user details to show updated fine status
				await fetchUserDetails();
			} else {
				console.error("Failed to clear fines:", result.error);
				alert(`Failed to clear fines: ${result.error}`);
			}
		} catch (error) {
			console.error("Failed to clear fines:", error);
			alert("Failed to clear fines. Please try again.");
		} finally {
			setClearingFines(false);
		}
	};

	const handleMarkReturned = (borrow) => {
		setPendingReturnTx(borrow);
		setShowReturnModal(true);
	};

	const confirmMarkReturned = async () => {
		if (!pendingReturnTx) return;

		const transactionId = pendingReturnTx.id;
		setProcessingReturns((prev) => ({ ...prev, [transactionId]: true }));

		try {
			// Calculate days overdue and fine
			const now = new Date();
			const deadline = new Date(pendingReturnTx.deadline);
			const daysOverdue = Math.max(0, Math.ceil((now - deadline) / (1000 * 60 * 60 * 24)));
			const fine = daysOverdue * 5;

			const response = await fetch("/api/transactions", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: transactionId,
					action: "return",
					fine,
					sendEmailConfirmation: true,
				}),
			});

			if (response.ok) {
				// Set success state
				setProcessingReturns((prev) => ({ ...prev, [transactionId]: false }));
				setSuccessReturns((prev) => ({ ...prev, [transactionId]: true }));

				// Clear success state after 3 seconds
				setTimeout(() => {
					setSuccessReturns((prev) => ({ ...prev, [transactionId]: false }));
				}, 3000);

				// Refresh user details to show updated borrow status
				await fetchUserDetails();
			} else {
				console.error("Failed to mark book as returned");
				alert("Failed to mark book as returned. Please try again.");
			}
		} catch (error) {
			console.error("Failed to mark book as returned:", error);
			alert("Failed to mark book as returned. Please try again.");
		} finally {
			setProcessingReturns((prev) => ({ ...prev, [transactionId]: false }));
			setShowReturnModal(false);
			setPendingReturnTx(null);
		}
	};

	const canDelete = () => {
		if (!userDetails) return false;
		const hasActiveBorrows = userDetails.activeBorrows > 0;
		const hasOutstandingFines = userDetails.totalFines > 0;
		return !hasActiveBorrows && (!hasOutstandingFines || finesCleared);
	};

	const proceedToConfirmation = () => {
		setStep(2);
	};

	if (!isOpen || !user) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
			<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
				<button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
					<X className="w-5 h-5" />
				</button>

				{step === 1 && (
					<>
						<div className="flex items-center gap-2 mb-4">
							<User className="w-6 h-6 text-blue-600" />
							<h2 className="text-xl font-bold">User Deletion Review</h2>
						</div>

						{loading ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								<span className="ml-2 text-gray-600">Loading user details...</span>
							</div>
						) : userDetails ? (
							<div className="space-y-6">
								{/* User Basic Info */}
								<div className="bg-gray-50 rounded-lg p-4">
									<h3 className="font-semibold text-gray-800 mb-2">User Information</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
										<div>
											<strong>Name:</strong> {user.name || "N/A"}
										</div>
										<div>
											<strong>Email:</strong> {user.email}
										</div>
										<div>
											<strong>Phone:</strong> {user.phone || "N/A"}
										</div>
										<div>
											<strong>Role:</strong> {user.role}
										</div>
										<div>
											<strong>Verified:</strong> {user.verifiedUser}
										</div>
									</div>
								</div>

								{/* Active Borrows */}
								<div className="bg-blue-50 rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<BookOpen className="w-5 h-5 text-blue-600" />
										<h3 className="font-semibold text-gray-800">Active Borrows</h3>
									</div>
									<div className="text-2xl font-bold text-blue-600 mb-2">{userDetails.activeBorrows}</div>

									{/* Borrow Details Accordion */}
									{userDetails.activeBorrows > 0 && userDetails.activeBorrowsDetails && userDetails.activeBorrowsDetails.length > 0 && (
										<div className="mt-3">
											<button onClick={() => setShowBorrowDetails(!showBorrowDetails)} className="flex items-center gap-2 text-blue-700 hover:text-blue-800 text-sm font-medium">
												{showBorrowDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
												Borrow Details
											</button>

											{showBorrowDetails && (
												<div className="mt-3 space-y-2">
													{userDetails.activeBorrowsDetails.map((borrow, index) => (
														<div key={borrow.id} className="bg-white border border-blue-200 rounded-lg p-3">
															<div className="grid grid-cols-1 gap-2 text-sm mb-3">
																<div>
																	<strong className="text-blue-800">Book:</strong> {borrow.bookTitle}
																</div>
																<div className="grid grid-cols-2 gap-4">
																	<div>
																		<strong className="text-blue-800">Borrowed:</strong> {new Date(borrow.borrowedAt).toLocaleDateString()} at{" "}
																		{new Date(borrow.borrowedAt).toLocaleTimeString([], {
																			hour: "2-digit",
																			minute: "2-digit",
																		})}
																	</div>
																	<div>
																		<strong className="text-blue-800">Deadline:</strong> {borrow.deadline ? new Date(borrow.deadline).toLocaleDateString() : "No deadline set"}
																	</div>
																</div>
																{borrow.fine > 0 && (
																	<div>
																		<strong className="text-red-600">Current Fine:</strong> <span className="text-red-600 font-bold">{borrow.fine} NOK</span>
																	</div>
																)}
															</div>
															{/* Mark Returned Button */}
															<div className="flex justify-end">
																<button onClick={() => handleMarkReturned(borrow)} disabled={processingReturns[borrow.id]} className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${processingReturns[borrow.id] ? "bg-gray-400 text-white cursor-not-allowed" : successReturns[borrow.id] ? "bg-green-500 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}>
																	{processingReturns[borrow.id] ? (
																		<>
																			<svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
																				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
																				<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																			</svg>
																			Processing...
																		</>
																	) : successReturns[borrow.id] ? (
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
														</div>
													))}
												</div>
											)}
										</div>
									)}

									{userDetails.activeBorrows > 0 && (
										<div className="bg-red-100 border border-red-300 rounded p-3 mt-2">
											<div className="flex items-center gap-2">
												<AlertTriangle className="w-4 h-4 text-red-600" />
												<span className="text-red-700 font-medium">Cannot delete user with active borrows</span>
											</div>
											<div className="text-red-600 text-sm mt-1">User must return all books before deletion</div>
										</div>
									)}
								</div>

								{/* Outstanding Fines */}
								<div className="bg-yellow-50 rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<DollarSign className="w-5 h-5 text-yellow-600" />
										<h3 className="font-semibold text-gray-800">Outstanding Fines</h3>
									</div>
									<div className="text-2xl font-bold text-yellow-600 mb-2">{userDetails.totalFines} NOK</div>
									{userDetails.totalFines > 0 && !finesCleared && (
										<div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-2">
											<div className="flex items-center justify-between">
												<div>
													<div className="flex items-center gap-2">
														<AlertTriangle className="w-4 h-4 text-yellow-600" />
														<span className="text-yellow-700 font-medium">Outstanding fines must be cleared</span>
													</div>
													<div className="text-yellow-600 text-sm mt-1">Clear fines and send confirmation email before deletion</div>
												</div>
												<button onClick={handleClearFines} disabled={clearingFines} className={`px-4 py-2 rounded-lg text-sm font-medium ${clearingFines ? "bg-gray-400 text-white cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700 text-white"}`}>
													{clearingFines ? (
														<div className="flex items-center gap-2">
															<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
															Clearing...
														</div>
													) : (
														"Clear Fines"
													)}
												</button>
											</div>
										</div>
									)}
									{finesCleared && (
										<div className="bg-green-100 border border-green-300 rounded p-3 mt-2">
											<div className="flex items-center gap-2">
												<Check className="w-4 h-4 text-green-600" />
												<span className="text-green-700 font-medium">Fines cleared successfully</span>
											</div>
											<div className="text-green-600 text-sm mt-1">Confirmation email sent to user</div>
										</div>
									)}
								</div>

								{/* Transaction Summary */}
								<div className="bg-gray-50 rounded-lg p-4">
									<h3 className="font-semibold text-gray-800 mb-2">Transaction History</h3>
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<div className="text-gray-600">Total Transactions:</div>
											<div className="font-bold text-lg">{userDetails.totalTransactions}</div>
										</div>
										<div>
											<div className="text-gray-600">Books Returned:</div>
											<div className="font-bold text-lg">{userDetails.returnedBooks}</div>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex justify-end space-x-3 pt-4 border-t">
									<button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
										Cancel
									</button>
									<button onClick={proceedToConfirmation} disabled={!canDelete()} className={`px-4 py-2 rounded-lg font-medium ${canDelete() ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
										{canDelete() ? "Proceed to Delete" : "Cannot Delete"}
									</button>
								</div>
							</div>
						) : (
							<div className="text-center py-8 text-red-600">Failed to load user details. Please try again.</div>
						)}
					</>
				)}

				{step === 2 && (
					<>
						<div className="flex items-center gap-2 mb-4">
							<AlertTriangle className="w-6 h-6 text-red-600" />
							<h2 className="text-xl font-bold text-red-600">Confirm User Deletion</h2>
						</div>

						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
							<div className="text-red-800 font-medium mb-2">⚠️ This action cannot be undone!</div>
							<div className="text-red-700 text-sm space-y-1">
								<div>• All user data will be permanently deleted</div>
								<div>• All transaction history will be removed</div>
								<div>• User will no longer be able to access their account</div>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<h3 className="font-semibold text-gray-800 mb-2">User to be deleted:</h3>
							<div className="text-sm">
								<div>
									<strong>Name:</strong> {user.name || "N/A"}
								</div>
								<div>
									<strong>Email:</strong> {user.email}
								</div>
								<div>
									<strong>Role:</strong> {user.role}
								</div>
							</div>
						</div>

						<div className="flex justify-end space-x-3">
							<button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
								Go Back
							</button>
							<button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">
								Delete User Permanently
							</button>
						</div>
					</>
				)}
			</div>

			{/* Mark Returned Confirmation Modal */}
			{showReturnModal && pendingReturnTx && (
				<ConfirmationModal
					isOpen={showReturnModal}
					onClose={() => {
						setShowReturnModal(false);
						setPendingReturnTx(null);
					}}
					onConfirm={confirmMarkReturned}
					title="Mark Book as Returned"
					message={(() => {
						const now = new Date();
						const deadline = new Date(pendingReturnTx.deadline);
						const daysOverdue = Math.max(0, Math.ceil((now - deadline) / (1000 * 60 * 60 * 24)));
						const fine = daysOverdue * 5;

						return (
							<>
								<div>
									<strong>Book:</strong> {pendingReturnTx.bookTitle}
								</div>
								<div>
									<strong>Student:</strong> {user.name || user.email}
								</div>
								<div>
									<strong>Deadline:</strong> {new Date(pendingReturnTx.deadline).toLocaleDateString()}
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
		</div>
	);
}
