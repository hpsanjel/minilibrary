import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPasswordChangeConfirmationEmail } from "@/lib/sendPasswordChangeConfirmationEmail";

export async function POST(request) {
	try {
		const { token, newPassword, currentPassword } = await request.json();

		// Token-based reset flow
		if (token) {
			if (!newPassword || newPassword.length < 6) {
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
			try {
				await sendPasswordChangeConfirmationEmail(user.email, user.name);
			} catch (emailError) {
				console.error("Failed to send password change confirmation email:", emailError);
			}
			return NextResponse.json({ message: "Password changed successfully" }, { status: 200 });
		}

		// Authenticated change flow (current password must be provided)
		if (!currentPassword || !newPassword) {
			return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 });
		}

		if (newPassword.length < 6) {
			return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
		}

		// Verify session and current password
		const { getServerSession } = await import("next-auth");
		const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
		const session = await getServerSession(authOptions);
		if (!session || !session.user?.email) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({ where: { email: session.user.email } });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const match = await bcrypt.compare(currentPassword, user.password);
		if (!match) {
			return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
		}

		const hashed = await bcrypt.hash(newPassword, 12);
		await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
		try {
			await sendPasswordChangeConfirmationEmail(user.email, user.name);
		} catch (emailError) {
			console.error("Failed to send password change confirmation email:", emailError);
		}
		return NextResponse.json({ message: "Password changed successfully" }, { status: 200 });

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
