import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (!token) {
			return NextResponse.json({ valid: false, error: "Token is required" }, { status: 400 });
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
			return NextResponse.json({ valid: false, error: "Invalid or expired token" }, { status: 400 });
		}

		return NextResponse.json({ valid: true });
	} catch (error) {
		console.error("Password token verification error:", error);
		return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
	}
}
