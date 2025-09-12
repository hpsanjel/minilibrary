import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import { getBaseUrl } from "@/lib/getBaseUrl";

export async function POST(req) {
	try {
		const { email } = await req.json();

		if (!email) {
			return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
		}

		// Find unverified user
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
		}

		if (user.verifiedUser === "Yes") {
			return new Response(JSON.stringify({ error: "Email is already verified" }), { status: 400 });
		}

		// Generate new verification token
		const token = crypto.randomBytes(32).toString("hex");
		const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Update user with new token
		await prisma.user.update({
			where: { id: user.id },
			data: {
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

		return new Response(
			JSON.stringify({
				message: "Verification email sent successfully",
				email: user.email,
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error("Resend verification error:", error);
		return new Response(JSON.stringify({ error: "Failed to resend verification email" }), { status: 500 });
	}
}
