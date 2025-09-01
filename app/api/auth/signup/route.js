import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

export async function POST(req) {
	try {
		const { name, email, password, phone, city, postalCode, address } = await req.json();
		if (!name || !email || !password) {
			return new Response(JSON.stringify({ error: "Name, email, and password are required" }), { status: 400 });
		}
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return new Response(JSON.stringify({ error: "Email already in use" }), { status: 400 });
		}
		const hashed = await bcrypt.hash(password, 10);
		// Generate verification token
		const token = crypto.randomBytes(32).toString("hex");
		const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashed,
				phone,
				city,
				postalCode,
				address,
				verifiedUser: "No",
				verificationToken: token,
				verificationTokenExpires: tokenExpires,
			},
		});

		// Send verification email
		const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`;
		await sendVerificationEmail({
			to: user.email,
			userName: user.name || user.email,
			verificationUrl,
		});

		return new Response(JSON.stringify({ id: user.id, email: user.email, name: user.name }), { status: 201 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Signup failed" }), { status: 500 });
	}
}
