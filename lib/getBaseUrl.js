/**
 * Get the base URL for the application, working in both development and production
 * @param {Request} req - The request object
 * @returns {string} The base URL
 */
export function getBaseUrl(req) {
	// Check environment variables first (for production)
	if (process.env.NEXTAUTH_URL) {
		return process.env.NEXTAUTH_URL;
	}

	if (process.env.NEXT_PUBLIC_BASE_URL) {
		return process.env.NEXT_PUBLIC_BASE_URL;
	}

	// For production hosting (Vercel, Netlify, etc.)
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// Dynamic detection from request headers
	if (req && req.headers) {
		const protocol = req.headers.get("x-forwarded-proto") || req.headers.get("x-forwarded-scheme") || "http";
		const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3001";

		return `${protocol}://${host}`;
	}

	// Development fallback
	return "http://localhost:3001";
}

/**
 * Get the base URL for client-side usage
 * @returns {string} The base URL
 */
export function getClientBaseUrl() {
	if (typeof window !== "undefined") {
		// Client-side: use current window location
		return `${window.location.protocol}//${window.location.host}`;
	}

	// Server-side fallback
	return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
}
