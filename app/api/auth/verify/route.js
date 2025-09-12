import prisma from "@/lib/prisma";
import { getBaseUrl } from "@/lib/getBaseUrl";

export async function GET(req) {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");

	// Get the correct base URL
	const baseUrl = getBaseUrl(req);

	if (!token) {
		return Response.redirect(`${baseUrl}/auth/verify-error?reason=no-token`, 302);
	}
	try {
		// Find user with this token and not expired
		const user = await prisma.user.findFirst({
			where: {
				verificationToken: token,
				verificationTokenExpires: { gt: new Date() },
			},
		});

		if (!user) {
			return Response.redirect(`${baseUrl}/auth/verify-error?reason=invalid-token`, 302);
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

		// Redirect to success page
		return Response.redirect(`${baseUrl}/auth/verify-success`, 302);
	} catch (error) {
		console.error("Verification error:", error);
		return Response.redirect(`${baseUrl}/auth/verify-error?reason=server-error`, 302);
	}
}
