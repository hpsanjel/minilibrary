import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendVerificationSuccessEmail } from "@/lib/sendVerificationSuccessEmail";
import { generateMembershipNumber } from "@/lib/membershipUtils";

// Get all users or specific user by ID
export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("id");

	if (userId) {
		// Get specific user with transactions
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: {
				id: true,
				membershipNumber: true,
				name: true,
				email: true,
				phone: true,
				city: true,
				postalCode: true,
				address: true,
				role: true,
				verifiedUser: true,
				transactions: {
					include: {
						book: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
			},
		});
		return new Response(JSON.stringify(user));
	} else {
		// Get all users
		const users = await prisma.user.findMany({
			select: {
				id: true,
				membershipNumber: true,
				name: true,
				email: true,
				phone: true,
				city: true,
				postalCode: true,
				address: true,
				role: true,
				verifiedUser: true,
			},
		});
		return new Response(JSON.stringify(users));
	}
}

// Create a new user
export async function POST(req) {
	try {
		const { name, email, password, phone, city, postalCode, address, role } = await req.json();

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return new Response(JSON.stringify({ error: "User with this email already exists" }), {
				status: 400,
			});
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Generate membership number
		const membershipNumber = await generateMembershipNumber();

		const user = await prisma.user.create({
			data: {
				membershipNumber,
				name,
				email,
				password: hashedPassword,
				phone,
				city,
				postalCode,
				address,
				role: role || "STUDENT",
				verifiedUser: "Yes", // Admin-created users are automatically verified
			},
		});

		// Return user without password
		const { password: _, ...userWithoutPassword } = user;
		return new Response(JSON.stringify(userWithoutPassword), { status: 201 });
	} catch (error) {
		console.error("Error creating user:", error);
		return new Response(JSON.stringify({ error: "Failed to create user" }), {
			status: 500,
		});
	}
}

// Update user (name, contact, role)
export async function PATCH(req) {
	const { id, name, phone, city, postalCode, address, role, verifiedUser } = await req.json();
	const data = { name, phone, city, postalCode, address, role };
	if (verifiedUser !== undefined) data.verifiedUser = verifiedUser;

	// Get user info before update to check if verification status changed
	const existingUser = await prisma.user.findUnique({
		where: { id: parseInt(id) },
		select: { verifiedUser: true, email: true, name: true },
	});

	const user = await prisma.user.update({
		where: { id: parseInt(id) },
		data,
	});

	// Send verification success email if user was just verified
	if (verifiedUser === "Yes" && existingUser.verifiedUser !== "Yes") {
		try {
			await sendVerificationSuccessEmail({
				to: existingUser.email,
				userName: existingUser.name || existingUser.email,
			});
			console.log(`Verification success email sent to ${existingUser.email}`);
		} catch (error) {
			console.error("Failed to send verification success email:", error);
			// Don't fail the user update if email fails
		}
	}

	return new Response(JSON.stringify(user));
}

// Delete user
export async function DELETE(req) {
	const { id } = await req.json();
	const userId = parseInt(id);

	try {
		// Check if user has active borrows
		const activeBorrows = await prisma.transaction.count({
			where: {
				userId: userId,
				returned: false,
			},
		});

		if (activeBorrows > 0) {
			return new Response(
				JSON.stringify({
					error: "Cannot delete user with active borrows",
					activeBorrows,
				}),
				{ status: 400 }
			);
		}

		// Check if user has outstanding fines
		const outstandingFines = await prisma.transaction.findMany({
			where: {
				userId: userId,
				fine: { gt: 0 },
			},
		});

		if (outstandingFines.length > 0) {
			const totalFines = outstandingFines.reduce((sum, t) => sum + t.fine, 0);
			return new Response(
				JSON.stringify({
					error: "Cannot delete user with outstanding fines",
					totalFines,
					fineCount: outstandingFines.length,
				}),
				{ status: 400 }
			);
		}

		// Delete all user transactions (history) first
		await prisma.transaction.deleteMany({ where: { userId } });

		// Delete the user
		await prisma.user.delete({ where: { id: userId } });

		return new Response(
			JSON.stringify({
				success: true,
				message: "User deleted successfully",
			})
		);
	} catch (error) {
		console.error("Error deleting user:", error);
		return new Response(JSON.stringify({ error: "Failed to delete user" }), { status: 500 });
	}
}
