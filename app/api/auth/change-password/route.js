import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPasswordChangeConfirmationEmail } from "@/lib/sendPasswordChangeConfirmationEmail";

export async function POST(request) {
	try {
		const { token, newPassword } = await request.json();

		if (!token || !newPassword) {
			return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
		}

		if (newPassword.length < 6) {
			return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
		}

		// Find user with this password reset token
		const user = await prisma.user.findFirst({
			where: {
				passwordResetToken: token,
				passwordResetTokenExpires: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(newPassword, 12);

		// Update user's password and clear reset token
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				passwordResetToken: null,
				passwordResetTokenExpires: null,
			},
		});

		// Send confirmation email
		try {
			await sendPasswordChangeConfirmationEmail(user.email, user.name);
		} catch (emailError) {
			console.error("Failed to send password change confirmation email:", emailError);
			// Don't fail the password change if email fails
		}

		return NextResponse.json({ message: "Password changed successfully" }, { status: 200 });
	} catch (error) {
		console.error("Password change error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
