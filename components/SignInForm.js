"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		const res = await signIn("credentials", {
			redirect: false,
			email,
			password,
		});
		setLoading(false);
		if (res?.error) {
			setError("Invalid email or password");
		} else {
			window.location.href = "/";
		}
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6">
			<h1 className="text-2xl font-bold text-center text-gray-900">Sign In</h1>
			{error && <p className="text-red-600 text-center">{error}</p>}
			<div>
				<label className="block mb-2 text-gray-700">Email</label>
				<input type="email" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={email} onChange={(e) => setEmail(e.target.value)} required />
			</div>
			<div>
				<label className="block mb-2 text-gray-700">Password</label>
				<input type="password" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={password} onChange={(e) => setPassword(e.target.value)} required />
			</div>
			<button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50" disabled={loading}>
				{loading ? "Signing in..." : "Sign In"}
			</button>
		</form>
	);
}
