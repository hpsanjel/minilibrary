"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [success, setSuccess] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			const res = await fetch("/api/auth/request-password-change", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (res.ok) {
				setSuccess("If an account with that email exists, a password reset link has been sent.");
			} else {
				setError(data.error || "Failed to send password reset email.");
			}
		} catch (err) {
			setError("Failed to send password reset email.");
		}
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6">
			<h1 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h1>
			{success && <p className="text-green-600 text-center">{success}</p>}
			{error && <p className="text-red-600 text-center">{error}</p>}
			<div>
				<label className="block mb-2 text-gray-700">Email</label>
				<input type="email" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={email} onChange={(e) => setEmail(e.target.value)} required />
			</div>
			<button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50" disabled={loading}>
				{loading ? "Sending..." : "Send Reset Link"}
			</button>
		</form>
	);
}
