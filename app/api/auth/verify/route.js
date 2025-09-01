import prisma from "@/lib/prisma";

export async function GET(req) {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");
	if (!token) {
		return new Response("Invalid verification link.", { status: 400 });
	}
	// Find user with this token and not expired
	const user = await prisma.user.findFirst({
		where: {
			verificationToken: token,
			verificationTokenExpires: { gt: new Date() },
		},
	});
	if (!user) {
		return new Response("Verification link is invalid or expired.", { status: 400 });
	}
	// Mark user as verified
	await prisma.user.update({
		where: { id: user.id },
		data: {
			verifiedUser: "Yes",
			verificationToken: null,
			verificationTokenExpires: null,
		},
	});
	// Redirect to a friendly verify-success page (absolute URL required)
	const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	return Response.redirect(`${baseUrl}/auth/verify-success`, 302);
}
