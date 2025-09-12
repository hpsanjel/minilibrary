"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthForm() {
	const { data: session, status } = useSession();
	const router = useRouter();
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
	const [success, setSuccess] = useState("");
	const [showResendVerification, setShowResendVerification] = useState(false);
	const [resendingEmail, setResendingEmail] = useState(false);

	// Redirect if already authenticated (in useEffect to avoid setState in render)
	useEffect(() => {
		if (status === "authenticated") {
			if (session?.user?.role === "ADMIN") {
				router.replace("/admin/dashboard");
			} else {
				router.replace("/");
			}
		}
	}, [status, session, router]);
	if (status === "authenticated") return null;

	const handleResendVerification = async () => {
		setResendingEmail(true);
		setError("");
		setSuccess("");

		try {
			const res = await fetch("/api/auth/resend-verification", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (res.ok) {
				setSuccess("Verification email sent! Please check your inbox.");
				setShowResendVerification(false);
			} else {
				setError(data.error || "Failed to resend verification email");
			}
		} catch (error) {
			setError("Failed to resend verification email");
		}

		setResendingEmail(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");
		setShowResendVerification(false);
		if (isSignUp) {
			// Call signup API
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password, phone, city, postalCode, address }),
			});
			const data = await res.json();
			setLoading(false);
			if (!res.ok) {
				setError(data.error || "Signup failed");
				return;
			}
			setSuccess("Signup successful! Please check your email to verify your account before signing in.");
			setIsSignUp(false);
			setEmail("");
			setPassword("");
			setName("");
			setPhone("");
			setCity("");
			setPostalCode("");
			setAddress("");
			return;
		} else {
			// Sign in
			const res = await signIn("credentials", {
				redirect: false,
				email,
				password,
			});
			setLoading(false);
			if (res?.error) {
				if (res.error === "EMAIL_NOT_VERIFIED") {
					setError("Your email is not verified. Please check your inbox or resend verification email.");
					setShowResendVerification(true);
				} else if (res.error === "INVALID_CREDENTIALS") {
					setError("Invalid email or password");
					setShowResendVerification(false);
				} else {
					setError("Sign in failed. Please try again.");
					setShowResendVerification(false);
				}
			} else {
				// Use router to redirect after successful login
				router.replace("/admin/dashboard");
			}
		}
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6" autoComplete="off">
			<h1 className="text-2xl font-bold text-center text-gray-900">{isSignUp ? "Sign Up" : "Sign In"}</h1>
			{error && (
				<div className="text-red-600 text-center">
					<p>{error}</p>
					{showResendVerification && !isSignUp && (
						<button type="button" onClick={handleResendVerification} disabled={resendingEmail} className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50">
							{resendingEmail ? "Sending..." : "Resend Verification Email"}
						</button>
					)}
				</div>
			)}
			{success && <p className="text-green-600 text-center">{success}</p>}
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
				<input type="email" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
			</div>
			<div>
				<label className="block mb-2 text-gray-700">Password</label>
				<input type="password" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
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
						setSuccess("");
						setShowResendVerification(false);
					}}
				>
					{isSignUp ? "Sign In" : "Sign Up"}
				</button>
			</p>
		</form>
	);
}
