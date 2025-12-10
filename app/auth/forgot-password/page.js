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
				setSuccess("Password reset link has been sent to your email. Please check your inbox.");
				setEmail(""); // Clear the email field on success
			} else {
				// Handle specific error cases
				if (res.status === 404) {
					setError("This email is not registered in our system. Please check the email address or sign up for a new account.");
				} else {
					setError(data.error || "Failed to send password reset email. Please try again.");
				}
			}
		} catch (err) {
			setError("Failed to send password reset email. Please try again later.");
		}
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6">
			<h1 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h1>
			<p className="text-sm text-gray-600 text-center">Enter your email address and we'll send you a link to reset your password.</p>

			{success && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
					<p className="text-green-700 text-sm">{success}</p>
				</div>
			)}

			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
				</div>
			)}

			<div>
				<label className="block mb-2 text-gray-700 font-medium">Email Address</label>
				<input
					type="email"
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Enter your email"
					required
				/>
			</div>
			<button
				type="submit"
				className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading}
			>
				{loading ? "Sending..." : "Send Reset Link"}
			</button>
			<div className="text-center">
				<a href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
					Back to Sign In
				</a>
			</div>
		</form>
	);
}
