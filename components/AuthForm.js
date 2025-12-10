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
		<form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow space-y-6" autoComplete="off">
			<h1 className="text-2xl font-bold text-center text-gray-900">{isSignUp ? "Sign Up" : "Sign In"}</h1>

			{callbackUrl && callbackUrl.includes("/books/borrow/") && !isSignUp && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
					<p className="text-blue-800 text-sm">
						📚 <strong>Almost there!</strong> Sign in to continue borrowing your selected book.
					</p>
				</div>
			)}

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
					<PhotoUpload photo={photo} setPhoto={setPhoto} />
				</>
			)}
			<div>
				<label className="block mb-2 text-gray-700">Email</label>
				<input type="email" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
			</div>
			<div>
				<label className="block mb-2 text-gray-700">Password</label>
				<input type="password" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
				{!isSignUp && (
					<div className="text-right mt-1">
						<a href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
							Forgot password?
						</a>
					</div>
				)}
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
