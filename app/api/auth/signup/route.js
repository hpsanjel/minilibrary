import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { generateMembershipNumber } from "@/lib/membershipUtils";

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

		// Generate membership number
		const membershipNumber = await generateMembershipNumber();

		const user = await prisma.user.create({
			data: {
				membershipNumber,
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
		const baseUrl = getBaseUrl(req);
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
