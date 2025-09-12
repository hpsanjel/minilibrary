export default function VerifyErrorPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
			<div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-md w-full">
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</div>
					<h1 className="text-xl sm:text-2xl font-bold text-red-700 mb-4">Verification Failed</h1>
					<p className="text-gray-700 mb-6 text-sm sm:text-base">Your verification link is invalid or has expired. Please request a new verification email.</p>
					<div className="space-y-3">
						<a href="/auth/signin" className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium">
							Go to Sign In
						</a>
						<a href="/auth/signup" className="block w-full text-center py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium">
							Sign Up Again
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
