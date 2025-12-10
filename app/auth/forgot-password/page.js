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
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
				{/* Brand Section (Left Side) */}
				<div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between text-white relative overflow-hidden">
					<div className="relative z-10">
						<div className="flex items-center gap-3 mb-8">
							<div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
								<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
							<span className="text-2xl font-bold tracking-wide">Mini Library</span>
						</div>
						<h2 className="text-4xl font-bold mb-6 leading-tight">
							Password Recovery
						</h2>
						<p className="text-blue-100 text-lg">
							Don&apos;t worry, it happens to the best of us. We&apos;ll help you get back into your account in no time.
						</p>
					</div>

					{/* Decorative circles */}
					<div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
					<div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>

					<div className="relative z-10 text-sm text-blue-200">
						© 2024 Mini Library System
					</div>
				</div>

				{/* Form Section (Right Side) */}
				<div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
					<div className="text-center md:text-left mb-8">
						<h3 className="text-2xl font-bold text-gray-900">Forgot Password?</h3>
						<p className="mt-2 text-sm text-gray-600">
							Enter your email address and we&apos;ll send you a link to reset your password.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{success && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
								<div className="flex-shrink-0 mt-0.5">
									<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<p className="text-green-700 text-sm font-medium">{success}</p>
							</div>
						)}

						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
								<div className="flex-shrink-0 mt-0.5">
									<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<p className="text-red-700 text-sm font-medium">{error}</p>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
									</svg>
								</div>
								<input
									type="email"
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
								/>
							</div>
						</div>

						<button
							type="submit"
							className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading}
						>
							{loading ? (
								<span className="flex items-center">
									<svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Sending Link...
								</span>
							) : (
								"Send Reset Link"
							)}
						</button>

						<div className="text-center">
							<a href="/auth/signin" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors group">
								<svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
								</svg>
								Back to Sign In
							</a>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
