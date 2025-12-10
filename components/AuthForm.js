"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Photo Upload Component
function PhotoUpload({ photo, setPhoto }) {
	const fileInputRef = useRef(null);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const [showCamera, setShowCamera] = useState(false);
	const [stream, setStream] = useState(null);

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				alert("Please select an image file");
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert("Please select an image smaller than 5MB");
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				setPhoto(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const startCamera = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user" }, // Front-facing camera for selfies
			});
			setStream(mediaStream);
			setShowCamera(true);
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
			}
		} catch (error) {
			console.error("Error accessing camera:", error);
			alert("Could not access camera. Please check permissions or use file upload instead.");
		}
	};

	const capturePhoto = () => {
		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			const context = canvas.getContext("2d");

			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context.drawImage(video, 0, 0);

			const dataURL = canvas.toDataURL("image/jpeg", 0.8);
			setPhoto(dataURL);
			stopCamera();
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		setShowCamera(false);
	};

	const removePhoto = () => {
		setPhoto("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div>
			<label className="block mb-2 text-gray-700">Profile Photo (Optional)</label>

			{!photo && !showCamera && (
				<div className="space-y-3">
					<div className="flex gap-3">
						<button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
							</svg>
							Upload Photo
						</button>
						<button type="button" onClick={startCamera} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Take Photo
						</button>
					</div>
					<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
				</div>
			)}

			{showCamera && (
				<div className="space-y-3">
					<div className="relative">
						<video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-lg border" />
						<canvas ref={canvasRef} className="hidden" />
					</div>
					<div className="flex gap-3">
						<button type="button" onClick={capturePhoto} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
							Capture Photo
						</button>
						<button type="button" onClick={stopCamera} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
							Cancel
						</button>
					</div>
				</div>
			)}

			{photo && !showCamera && (
				<div className="space-y-3">
					<div className="relative">
						<img src={photo} alt="Profile preview" className="w-full h-64 object-cover rounded-lg border" />
					</div>
					<div className="flex gap-3">
						<button type="button" onClick={removePhoto} className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
							Remove Photo
						</button>
						<button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
							Change Photo
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default function AuthForm() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl");
	const urlError = searchParams.get("error"); // Get error from URL if redirected from NextAuth

	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [address, setAddress] = useState("");
	const [photo, setPhoto] = useState(""); // Base64 encoded photo
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [showResendVerification, setShowResendVerification] = useState(false);
	const [resendingEmail, setResendingEmail] = useState(false);

	// Show URL error if present
	useEffect(() => {
		if (urlError) {
			console.log("NextAuth URL error:", urlError);
			setError(`Authentication error: ${urlError}`);
		}
	}, [urlError]);

	// Redirect if already authenticated (in useEffect to avoid setState in render)
	useEffect(() => {
		console.log("AuthForm: status =", status, "role =", session?.user?.role, "callbackUrl =", callbackUrl);

		if (status === "authenticated") {
			let redirectUrl;

			if (callbackUrl) {
				redirectUrl = callbackUrl;
			} else if (session?.user?.role === "ADMIN") {
				redirectUrl = "/admin/dashboard";
			} else if (session?.user?.role === "STUDENT") {
				redirectUrl = "/books";
			} else {
				redirectUrl = "/";
			}

			console.log("AuthForm: Redirecting to:", redirectUrl);
			router.replace(redirectUrl);
		}
	}, [status, session, router, callbackUrl]);
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
				body: JSON.stringify({ name, email, password, phone, city, postalCode, address, photo }),
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
			setPhoto("");
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
				console.log("Sign in error:", res.error); // Debug log
				if (res.error === "EMAIL_NOT_VERIFIED") {
					setError("Your email is not verified. Please check your inbox or resend verification email.");
					setShowResendVerification(true);
				} else if (res.error === "INVALID_CREDENTIALS" || res.error === "CredentialsSignin") {
					// CredentialsSignin is the default error when authorize returns null
					setError("Invalid email or password");
					setShowResendVerification(false);
				} else {
					setError(`Sign in failed: ${res.error}`);
					setShowResendVerification(false);
				}
			} else {
				// Sign-in successful, redirect is handled by useEffect above when session updates
				// Don't redirect here to avoid conflicts with useEffect
			}
		}
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
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
							</div>
							<span className="text-2xl font-bold tracking-wide">Mini Library</span>
						</div>
						<h2 className="text-4xl font-bold mb-6 leading-tight">
							{isSignUp ? "Join Our Community" : "Welcome Back"}
						</h2>
						<p className="text-blue-100 text-lg">
							{isSignUp
								? "Start your journey with thousands of books at your fingertips. Create an account today."
								: "Access your personalized library dashboard, track your borrowed books, and discover new reads."}
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
				<div className="w-full md:w-1/2 p-8 sm:p-12">
					<div className="text-center md:text-left mb-8">
						<h3 className="text-2xl font-bold text-gray-900">
							{isSignUp ? "Create an Account" : "Sign In to Your Account"}
						</h3>
						<p className="mt-2 text-sm text-gray-600">
							{isSignUp ? "Please fill in your details below" : "Enter your credentials to access your account"}
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
						{callbackUrl && callbackUrl.includes("/books/borrow/") && !isSignUp && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
								<div className="flex-shrink-0 mt-0.5">
									<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<p className="text-blue-800 text-sm">
									<strong>Almost there!</strong> Sign in to continue borrowing your selected book.
								</p>
							</div>
						)}

						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
								<p className="text-red-600 text-sm font-medium">{error}</p>
								{showResendVerification && !isSignUp && (
									<button type="button" onClick={handleResendVerification} disabled={resendingEmail} className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition disabled:opacity-50 font-medium">
										{resendingEmail ? "Sending..." : "Resend Verification Email"}
									</button>
								)}
							</div>
						)}

						{success && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
								<p className="text-green-600 text-sm font-medium">{success}</p>
							</div>
						)}

						{isSignUp && (
							<div className="space-y-4 animate-fade-in">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
										<input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
										<input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
									<input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Library St" />
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">City</label>
										<input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
										<input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10001" />
									</div>
								</div>

								<div className="pt-2">
									<PhotoUpload photo={photo} setPhoto={setPhoto} />
								</div>
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
										</svg>
									</div>
									<input type="email" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required placeholder="you@example.com" />
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
									<input type="password" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required placeholder="••••••••" />
								</div>
								{!isSignUp && (
									<div className="flex justify-end mt-2">
										<a href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
											Forgot password?
										</a>
									</div>
								)}
							</div>
						</div>

						<button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
							{loading ? (
								<span className="flex items-center">
									<svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									{isSignUp ? "Creating Account..." : "Signing In..."}
								</span>
							) : (
								isSignUp ? "Create Account" : "Sign In"
							)}
						</button>

						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-200"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">
									{isSignUp ? "Already have an account?" : "New to Mini Library?"}
								</span>
							</div>
						</div>

						<button
							type="button"
							className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
							onClick={() => {
								setIsSignUp((v) => !v);
								setError("");
								setSuccess("");
								setShowResendVerification(false);
							}}
						>
							{isSignUp ? "Sign In Instead" : "Create an Account"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
