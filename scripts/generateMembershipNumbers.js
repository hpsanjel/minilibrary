const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function generateMembershipNumber() {
	const currentYear = new Date().getFullYear();
	const prefix = `LIB-${currentYear}-`;

	// Find the highest membership number for the current year
	const lastUser = await prisma.user.findFirst({
		where: {
			membershipNumber: {
				not: null,
				startsWith: prefix,
			},
		},
		orderBy: {
			membershipNumber: "desc",
		},
	});

	let nextNumber = 1;
	if (lastUser && lastUser.membershipNumber) {
		// Extract the number part from the last membership number
		const lastNumber = parseInt(lastUser.membershipNumber.split("-")[2]);
		nextNumber = lastNumber + 1;
	}

	// Format with leading zeros (4 digits)
	const formattedNumber = nextNumber.toString().padStart(4, "0");
	return `${prefix}${formattedNumber}`;
}

async function main() {
	try {
		console.log("Starting membership number generation...");

		// First, try to add the column if it doesn't exist
		try {
			await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "membershipNumber" TEXT`;
			console.log("Added membershipNumber column to User table");
		} catch (error) {
			if (error.message.includes("already exists")) {
				console.log("membershipNumber column already exists");
			} else {
				console.log("Column might already exist or another issue:", error.message);
			}
		}

		// Get all users without membership numbers
		const usersWithoutMembership = await prisma.user.findMany({
			where: {
				OR: [{ membershipNumber: null }, { membershipNumber: "" }],
			},
			orderBy: {
				id: "asc",
			},
		});

		console.log(`Found ${usersWithoutMembership.length} users without membership numbers`);

		// Generate membership numbers for each user
		for (let i = 0; i < usersWithoutMembership.length; i++) {
			const user = usersWithoutMembership[i];
			const membershipNumber = await generateMembershipNumber();

			await prisma.user.update({
				where: { id: user.id },
				data: { membershipNumber },
			});

			console.log(`Generated membership number ${membershipNumber} for user ${user.email}`);
		}

		// Now add the unique constraint
		try {
			await prisma.$executeRaw`ALTER TABLE "User" ADD CONSTRAINT "User_membershipNumber_key" UNIQUE ("membershipNumber")`;
			console.log("Added unique constraint to membershipNumber column");
		} catch (error) {
			if (error.message.includes("already exists")) {
				console.log("Unique constraint already exists");
			} else {
				console.log("Could not add unique constraint:", error.message);
			}
		}

		console.log("Membership number generation completed successfully!");
	} catch (error) {
		console.error("Error generating membership numbers:", error);
	} finally {
		await prisma.$disconnect();
	}
}

main();
