"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordContent() {
	"use client";
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [tokenValid, setTokenValid] = useState(null);

	useEffect(() => {
		if (!token) {
			setTokenValid(false);
			setError("Missing token.");
			return;
		}
		fetch(`/api/auth/verify-password-token?token=${token}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.valid) setTokenValid(true);
				else {
					setTokenValid(false);
					setError(data.error || "Invalid or expired token.");
				}
			})
			.catch(() => {
				setTokenValid(false);
				setError("Failed to verify token.");
			});
	}, [token]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		if (newPassword.length < 6) {
			setError("Password must be at least 6 characters long.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		setLoading(true);
		const res = await fetch("/api/auth/change-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token, newPassword }),
		});
		const data = await res.json();
		setLoading(false);
		if (res.ok) {
			setSuccess("Password changed successfully! You can now sign in.");
			setTimeout(() => router.replace("/auth/signin"), 2000);
		} else {
			setError(data.error || "Failed to change password.");
		}
	};

	if (tokenValid === false) {
		return (
			<div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow text-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h1>
				<p className="text-red-600">{error || "Invalid or expired token."}</p>
			</div>
		);
	}

	if (tokenValid === null) {
		return (
			<div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow text-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h1>
				<p>Verifying token...</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6">
			<h1 className="text-2xl font-bold text-center text-gray-900">Reset Password</h1>
			{success && <p className="text-green-600 text-center">{success}</p>}
			{error && <p className="text-red-600 text-center">{error}</p>}
			<div>
				<label className="block mb-2 text-gray-700">New Password</label>
				<input type="password" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
			</div>
			<div>
				<label className="block mb-2 text-gray-700">Confirm New Password</label>
				<input type="password" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
			</div>
			<button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50" disabled={loading}>
				{loading ? "Changing..." : "Change Password"}
			</button>
		</form>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow text-center">Loading...</div>}>
			<ResetPasswordContent />
		</Suspense>
	);
}
