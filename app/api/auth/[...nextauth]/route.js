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
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.membershipNumber = user.membershipNumber;
			}
			return token;
		},
		async session({ session, token }) {
			if (token?.id) session.user.id = token.id;
			if (token?.role) session.user.role = token.role;
			if (token?.membershipNumber) session.user.membershipNumber = token.membershipNumber;
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
