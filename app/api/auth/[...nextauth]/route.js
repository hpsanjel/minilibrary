import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: { email: { label: "Email" }, password: { label: "Password" } },
			async authorize(credentials) {
				try {
					const user = await prisma.user.findUnique({ where: { email: credentials.email } });

					if (!user) {
						// User not found
						return null;
					}

					const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

					if (!isPasswordValid) {
						// Invalid password
						return null;
					}

					if (user.verifiedUser !== "Yes") {
						// Not verified - throw specific error
						throw new Error("EMAIL_NOT_VERIFIED");
					}

					// Success - return user object
					// Note: Photo is NOT included to keep JWT size small
					return {
						id: String(user.id), // Convert to string for JWT
						email: user.email,
						name: user.name,
						role: user.role,
						membershipNumber: user.membershipNumber,
					};
				} catch (error) {
					// Re-throw our custom errors
					if (error.message === "EMAIL_NOT_VERIFIED") {
						throw error;
					}
					// Log other errors and return null
					console.error("Error in authorize:", error);
					return null;
				}
			},
		}),
	],
	session: { strategy: "jwt" },
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: "/auth/signin",
		error: "/auth/signin", // Redirect errors back to sign in page
	},
	callbacks: {
		async redirect({ url, baseUrl }) {
			console.log("Redirect callback - url:", url, "baseUrl:", baseUrl);
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
		async jwt({ token, user }) {
			// If this is a new sign-in
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.membershipNumber = user.membershipNumber;
				// ❌ DON'T store photo in JWT - it's too large for cookies!
				// Photos will be fetched from the database when needed
				token.lastUpdate = Date.now();

				// Check token size (JWT cookies have ~4KB limit)
				const tokenSize = JSON.stringify(token).length;
				console.log("JWT: New sign-in for user:", user.email, "role:", user.role, "token size:", tokenSize, "bytes");

				if (tokenSize > 3500) {
					console.warn("⚠️ JWT token is large:", tokenSize, "bytes. May exceed cookie limit!");
				}
			}

			// Only refresh if we have valid token data and enough time has passed
			const shouldRefresh = token.id && Date.now() - (token.lastUpdate || 0) > 60 * 60 * 1000;

			if (shouldRefresh) {
				console.log("JWT: Refreshing token for user ID:", token.id);
				try {
					const freshUser = await prisma.user.findUnique({
						where: { id: parseInt(token.id) },
						select: { role: true, membershipNumber: true, name: true, email: true },
					});

					if (freshUser) {
						token.role = freshUser.role;
						token.membershipNumber = freshUser.membershipNumber;
						token.lastUpdate = Date.now();
						console.log("JWT: Token refreshed for user:", freshUser.email, "role:", freshUser.role);
					} else {
						console.log("JWT: User not found during refresh for ID:", token.id);
					}
				} catch (error) {
					console.error("Error refreshing user data in JWT callback:", error);
					// Don't fail the callback, just skip the refresh
				}
			}

			return token;
		},
		async session({ session, token }) {
			try {
				console.log("Session callback START - token:", { id: token?.id, role: token?.role, email: session?.user?.email });

				// Ensure session.user exists before modifying it
				if (!session?.user) {
					console.error("Session callback ERROR: session.user is undefined");
					return session;
				}

				if (token?.id) session.user.id = parseInt(token.id); // Convert back to number
				if (token?.role) session.user.role = token.role;
				if (token?.membershipNumber) session.user.membershipNumber = token.membershipNumber;
				// Photo is NOT stored in JWT - fetch from database when needed

				console.log("Session callback SUCCESS - user:", {
					id: session.user.id,
					role: session.user.role,
					email: session.user.email
				});

				return session;
			} catch (error) {
				console.error("Session callback ERROR:", error);
				// Return session even if there's an error to avoid breaking auth
				return session;
			}
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
