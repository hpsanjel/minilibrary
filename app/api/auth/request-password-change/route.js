import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordChangeRequestEmail } from "@/lib/sendPasswordChangeRequestEmail";
import { getBaseUrl } from "@/lib/getBaseUrl";

export async function POST(req) {
	try {
		const { email, currentPassword } = await req.json();

		if (!email) {
			return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
		}

		if (!currentPassword) {
			return new Response(JSON.stringify({ error: "Current password is required" }), { status: 400 });
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
		}

		// Verify current password
		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordValid) {
			return new Response(JSON.stringify({ error: "Incorrect current password" }), { status: 401 });
		}

		// Generate password change token
		const token = crypto.randomBytes(32).toString("hex");
		const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

		// Log token for local testing
		console.log("Password reset token generated for", email, ":", token);

		// Update user with password change token
		await prisma.user.update({
			where: { email },
			data: {
				passwordResetToken: token,
				passwordResetTokenExpires: tokenExpires,
			},
		});

		// Send password change email
		const baseUrl = getBaseUrl(req);
		const passwordChangeUrl = `${baseUrl}/auth/reset-password?token=${token}`;

		await sendPasswordChangeRequestEmail({
			to: user.email,
			userName: user.name || user.email,
			passwordChangeUrl,
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: "Password change link sent to your email",
				// include token in response for local debugging only
				debugToken: process.env.NODE_ENV !== "production" ? token : undefined,
			}),
			{
				status: 200,
			}
		);
	} catch (error) {
		console.error("Password change request error:", error);
		return new Response(JSON.stringify({ error: "Failed to process password change request" }), {
			status: 500,
		});
	}
}
