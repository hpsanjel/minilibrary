export default function VerifySuccessPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<div className="bg-white p-8 rounded shadow-md max-w-md w-full">
				<h1 className="text-2xl font-bold text-green-700 mb-4 text-center">Email Verified!</h1>
				<p className="text-gray-700 text-center mb-6">Your email has been successfully verified. You can now sign in to your account.</p>
				<a href="/auth/signin" className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
					Go to Sign In
				</a>
			</div>
		</div>
	);
}
