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
				const user = await prisma.user.findUnique({ where: { email: credentials.email } });
				if (user && (await bcrypt.compare(credentials.password, user.password))) {
					if (user.verifiedUser === "Yes") {
						return {
							id: user.id,
							email: user.email,
							name: user.name,
							role: user.role,
							membershipNumber: user.membershipNumber,
							photo: user.photo,
						};
					} else {
						// Not verified - throw specific error
						throw new Error("EMAIL_NOT_VERIFIED");
					}
				}
				// Invalid credentials
				throw new Error("INVALID_CREDENTIALS");
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
		async jwt({ token, user }) {
			// If this is a new sign-in
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.membershipNumber = user.membershipNumber;
				token.photo = user.photo;
				token.lastUpdate = Date.now();
				console.log("JWT: New sign-in for user:", user.email, "role:", user.role);
			}

			// Only refresh if we have valid token data and enough time has passed
			const shouldRefresh = token.id && Date.now() - (token.lastUpdate || 0) > 60 * 60 * 1000;

			if (shouldRefresh) {
				console.log("JWT: Refreshing token for user ID:", token.id);
				try {
					const freshUser = await prisma.user.findUnique({
						where: { id: parseInt(token.id) },
						select: { photo: true, role: true, membershipNumber: true, name: true, email: true },
					});

					if (freshUser) {
						token.photo = freshUser.photo;
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
			if (token?.id) session.user.id = token.id;
			if (token?.role) session.user.role = token.role;
			if (token?.membershipNumber) session.user.membershipNumber = token.membershipNumber;
			if (token?.photo) session.user.photo = token.photo;
			console.log("Session callback - user role:", session.user.role, "email:", session.user.email);
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
