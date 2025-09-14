// Cleanup script to remove duplicate transactions
// Run with: node scripts/cleanup-duplicates.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanupDuplicateTransactions() {
	console.log("🔍 Finding duplicate transactions...");

	try {
		// Find all active (unreturned) transactions grouped by user and book
		const duplicates = await prisma.transaction.groupBy({
			by: ["userId", "bookId"],
			where: {
				returned: false,
			},
			_count: {
				id: true,
			},
			having: {
				id: {
					_count: {
						gt: 1,
					},
				},
			},
		});

		console.log(`Found ${duplicates.length} sets of duplicate transactions`);

		for (const duplicate of duplicates) {
			console.log(`\n📚 Processing duplicates for User ${duplicate.userId}, Book ${duplicate.bookId}`);

			// Get all transactions for this user-book combination
			const transactions = await prisma.transaction.findMany({
				where: {
					userId: duplicate.userId,
					bookId: duplicate.bookId,
					returned: false,
				},
				orderBy: {
					createdAt: "asc", // Keep the oldest (first) transaction
				},
				include: {
					user: { select: { name: true, email: true } },
					book: { select: { title: true, author: true } },
				},
			});

			if (transactions.length > 1) {
				const keepTransaction = transactions[0]; // Keep the first/oldest
				const removeTransactions = transactions.slice(1); // Remove the rest

				console.log(`  ✅ Keeping transaction ${keepTransaction.id} (${keepTransaction.createdAt})`);
				console.log(`  🗑️ Removing ${removeTransactions.length} duplicate transaction(s):`);

				for (const tx of removeTransactions) {
					console.log(`    - Transaction ${tx.id} (${tx.createdAt})`);

					// Delete the duplicate transaction
					await prisma.transaction.delete({
						where: { id: tx.id },
					});

					// Increment book copies back (since we're removing a borrow record)
					await prisma.book.update({
						where: { id: duplicate.bookId },
						data: {
							copies: { increment: 1 },
						},
					});
				}

				// Update book availability if needed
				const book = await prisma.book.findUnique({
					where: { id: duplicate.bookId },
				});

				if (book && book.copies > 0 && !book.available) {
					await prisma.book.update({
						where: { id: duplicate.bookId },
						data: { available: true },
					});
					console.log(`  📖 Marked book "${book.title}" as available again`);
				}
			}
		}

		console.log("\n✨ Cleanup completed!");

		// Show summary of current active borrows per user
		console.log("\n📊 Current active borrows per user:");
		const activeBorrows = await prisma.transaction.groupBy({
			by: ["userId"],
			where: {
				returned: false,
			},
			_count: {
				id: true,
			},
		});

		for (const borrow of activeBorrows) {
			const user = await prisma.user.findUnique({
				where: { id: borrow.userId },
				select: { name: true, email: true },
			});
			console.log(`  👤 ${user?.name || user?.email}: ${borrow._count.id} book(s)`);
		}
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
	} finally {
		await prisma.$disconnect();
	}
}

cleanupDuplicateTransactions();
