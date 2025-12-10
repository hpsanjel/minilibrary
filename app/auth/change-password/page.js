"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ChangePasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [formData, setFormData] = useState({
		newPassword: "",
		confirmPassword: "",
		currentPassword: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("info");
	const [isValidToken, setIsValidToken] = useState(null);

	useEffect(() => {
		if (!token) {
			setMessage("Invalid password change link");
			setMessageType("error");
			setIsValidToken(false);
			return;
		}

		// Verify token validity
		fetch(`/api/auth/verify-password-token?token=${token}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.valid) {
					setIsValidToken(true);
				} else {
					setMessage(data.error || "Invalid or expired password change link");
					setMessageType("error");
					setIsValidToken(false);
				}
			})
			.catch(() => {
				setMessage("Error verifying password change link");
				setMessageType("error");
				setIsValidToken(false);
			});
	}, [token]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (formData.newPassword !== formData.confirmPassword) {
			setMessage("Passwords do not match");
			setMessageType("error");
			return;
		}

		if (formData.newPassword.length < 6) {
			setMessage("Password must be at least 6 characters long");
			setMessageType("error");
			return;
		}

		// If token is present, use token-based flow. Otherwise use authenticated flow which requires currentPassword
		setIsSubmitting(true);
		setMessage("");

		try {
			let body;
			if (token) {
				body = { token, newPassword: formData.newPassword };
			} else {
				// Need to verify current password first
				if (!formData.currentPassword) {
					setMessage("Please enter your current password to confirm change.");
					setMessageType("error");
					setIsSubmitting(false);
					return;
				}
				// Optionally verify current password via API
				const verifyRes = await fetch("/api/auth/verify-current-password", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ currentPassword: formData.currentPassword }),
				});
				const verifyData = await verifyRes.json();
				if (!verifyRes.ok || !verifyData.valid) {
					setMessage(verifyData.error || "Current password is incorrect");
					setMessageType("error");
					setIsSubmitting(false);
					return;
				}
				body = { currentPassword: formData.currentPassword, newPassword: formData.newPassword };
			}

			const response = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const result = await response.json();

			if (response.ok) {
				setMessage("Password changed successfully! You will be redirected to sign in.");
				setMessageType("success");
				setTimeout(() => {
					router.push("/auth/signin");
				}, 3000);
			} else {
				setMessage(result.error || "Failed to change password");
				setMessageType("error");
			}
		} catch (error) {
			setMessage("Network error. Please try again.");
			setMessageType("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleInputChange = (e) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
		setMessage("");
	};

	if (isValidToken === null) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Verifying password change link...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!isValidToken) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<div className="text-center">
						<div className="text-red-500 text-5xl mb-4">⚠️</div>
						<h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Link</h1>
						<p className="text-gray-600 mb-6">{message}</p>
						<button onClick={() => router.push("/auth/signin")} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200">
							Go to Sign In
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-2xl font-bold text-gray-800 mb-2">Set New Password</h1>
					<p className="text-gray-600">Enter your new password below</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
							New Password
						</label>
						<input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter new password" required disabled={isSubmitting} minLength={6} />
						<p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
					</div>

					<div>
						<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
							Confirm New Password
						</label>
						<input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Confirm new password" required disabled={isSubmitting} minLength={6} />
					</div>

					{!token && (
						<div>
							<label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
								Current Password
							</label>
							<input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter current password" required={!token} disabled={isSubmitting} minLength={6} />
						</div>
					)}

					{message && <div className={`p-3 rounded-md text-sm ${messageType === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message}</div>}

					<button type="submit" disabled={isSubmitting || !formData.newPassword || !formData.confirmPassword} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition duration-200">
						{isSubmitting ? (
							<span className="flex items-center justify-center">
								<svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Changing Password...
							</span>
						) : (
							"Change Password"
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<button onClick={() => router.push("/auth/signin")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
						Back to Sign In
					</button>
				</div>
			</div>
		</div>
	);
}

function LoadingSpinner() {
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		</div>
	);
}

export default function ChangePasswordPage() {
	return (
		<Suspense fallback={<LoadingSpinner />}>
			<ChangePasswordForm />
		</Suspense>
	);
}
