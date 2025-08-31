"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthForm() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [address, setAddress] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		if (isSignUp) {
			// Call signup API
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password, phone, city, postalCode, address }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Signup failed");
				setLoading(false);
				return;
			}
			// Auto sign in after signup
			const signInRes = await signIn("credentials", {
				redirect: false,
				email,
				password,
			});
			setLoading(false);
			if (signInRes?.error) {
				setError("Sign in after signup failed");
			} else {
				window.location.href = "/";
			}
		} else {
			// Sign in
			const res = await signIn("credentials", {
				redirect: false,
				email,
				password,
			});
			setLoading(false);
			if (res?.error) {
				setError("Invalid email or password");
			} else {
				window.location.href = "/admin/dashboard";
			}
		}
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6">
			<h1 className="text-2xl font-bold text-center text-gray-900">{isSignUp ? "Sign Up" : "Sign In"}</h1>
			{error && <p className="text-red-600 text-center">{error}</p>}
			{isSignUp && (
				<>
					<div>
						<label className="block mb-2 text-gray-700">Name</label>
						<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={name} onChange={(e) => setName(e.target.value)} required />
					</div>
					<div>
						<label className="block mb-2 text-gray-700">Address</label>
						<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={address} onChange={(e) => setAddress(e.target.value)} />
					</div>
					<div>
						<label className="block mb-2 text-gray-700">City</label>
						<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={city} onChange={(e) => setCity(e.target.value)} />
					</div>
					<div>
						<label className="block mb-2 text-gray-700">Postal Code</label>
						<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
					</div>
					<div>
						<label className="block mb-2 text-gray-700">Phone</label>
						<input type="text" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={phone} onChange={(e) => setPhone(e.target.value)} />
					</div>
				</>
			)}
			<div>
				<label className="block mb-2 text-gray-700">Email</label>
				<input type="email" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={email} onChange={(e) => setEmail(e.target.value)} required />
			</div>
			<div>
				<label className="block mb-2 text-gray-700">Password</label>
				<input type="password" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={password} onChange={(e) => setPassword(e.target.value)} required />
			</div>
			<button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50" disabled={loading}>
				{loading ? (isSignUp ? "Signing up..." : "Signing in...") : isSignUp ? "Sign Up" : "Sign In"}
			</button>
			<p className="text-center text-gray-600">
				{isSignUp ? "Already have an account?" : "Don't have an account?"}
				<button
					type="button"
					className="ml-2 text-blue-600 hover:underline focus:outline-none"
					onClick={() => {
						setIsSignUp((v) => !v);
						setError("");
					}}
				>
					{isSignUp ? "Sign In" : "Sign Up"}
				</button>
			</p>
		</form>
	);
}
