import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate a new membership number in format LIB-YYYY-NNNN
 * @returns {Promise<string>} The new membership number
 */
export async function generateMembershipNumber() {
	const currentYear = new Date().getFullYear();
	const prefix = `LIB-${currentYear}-`;

	// Find the highest membership number for the current year
	const lastUser = await prisma.user.findFirst({
		where: {
			membershipNumber: {
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

/**
 * Generate membership numbers for existing users who don't have one
 * This is for migration purposes
 */
export async function generateMembershipNumbersForExistingUsers() {
	try {
		// Get all users without membership numbers
		const usersWithoutMembership = await prisma.user.findMany({
			where: {
				membershipNumber: {
					equals: null,
				},
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

		console.log("Membership number generation completed");
	} catch (error) {
		console.error("Error generating membership numbers:", error);
		throw error;
	}
}

/**
 * Find user by membership number
 * @param {string} membershipNumber The membership number to search for
 * @returns {Promise<Object|null>} The user object or null if not found
 */
export async function findUserByMembershipNumber(membershipNumber) {
	return await prisma.user.findUnique({
		where: {
			membershipNumber: membershipNumber,
		},
		include: {
			transactions: {
				include: {
					book: true,
				},
			},
		},
	});
}

/**
 * Validate membership number format
 * @param {string} membershipNumber The membership number to validate
 * @returns {boolean} True if valid format
 */
export function isValidMembershipNumber(membershipNumber) {
	const regex = /^LIB-\d{4}-\d{4}$/;
	return regex.test(membershipNumber);
}
