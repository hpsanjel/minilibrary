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
						return { id: user.id, email: user.email, name: user.name, role: user.role };
					} else {
						// Not verified
						throw new Error("Please verify your email before signing in.");
					}
				}
				return null;
			},
		}),
	],
	session: { strategy: "jwt" },
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			if (token?.id) session.user.id = token.id;
			if (token?.role) session.user.role = token.role;
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
