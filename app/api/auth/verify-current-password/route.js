import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
	try {
		const { currentPassword } = await req.json();
		if (!currentPassword) {
			return new Response(JSON.stringify({ error: "Current password is required" }), { status: 400 });
		}

		const session = await getServerSession(authOptions);
		if (!session || !session.user?.email) {
			return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
		}

		const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { password: true } });
		if (!user) return new Response(JSON.stringify({ valid: false, error: "User not found" }), { status: 404 });

		const match = await bcrypt.compare(currentPassword, user.password);
		return new Response(JSON.stringify({ valid: !!match }));
	} catch (err) {
		console.error("Verify current password error:", err);
		return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
	}
}
