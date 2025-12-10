import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q");

		if (!query || query.length < 2) {
			return NextResponse.json({ users: [], books: [] });
		}

		const searchTerm = query.toLowerCase();

		// Search users by name, email, membershipNumber, phone
		const users = await prisma.user.findMany({
			where: {
				OR: [{ name: { contains: searchTerm, mode: "insensitive" } }, { email: { contains: searchTerm, mode: "insensitive" } }, { membershipNumber: { contains: searchTerm, mode: "insensitive" } }, { phone: { contains: searchTerm, mode: "insensitive" } }],
			},
			include: {
				Transaction: {
					include: {
						Book: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
			},
		});

		// Search books by title, author, ISBN
		const books = await prisma.book.findMany({
			where: {
				OR: [{ title: { contains: searchTerm, mode: "insensitive" } }, { author: { contains: searchTerm, mode: "insensitive" } }, { isbn: { contains: searchTerm, mode: "insensitive" } }],
			},
			include: {
				Transaction: {
					include: {
						User: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
			},
		});

		// Calculate additional user data
		const enrichedUsers = users.map((user) => {
			const activeTransactions = (user.Transaction || []).filter((transaction) => !transaction.returned);
			const totalFines = (user.Transaction || []).filter((tx) => tx.fine > 0).reduce((sum, tx) => sum + tx.fine, 0);
			const totalBorrowed = (user.Transaction || []).length;

			return {
				...user,
				activeTransactions,
				totalFines,
				totalBorrowed,
				currentlyBorrowedBooks: activeTransactions.length,
			};
		});

		// Calculate additional book data
		const enrichedBooks = books.map((book) => {
			const activeTransactions = (book.Transaction || []).filter((transaction) => !transaction.returned);
			const totalCopies = book.copies || 1;
			const availableCopies = totalCopies - activeTransactions.length;
			const borrowedBy = activeTransactions.map((transaction) => transaction.User);

			return {
				...book,
				activeTransactions,
				availableCopies,
				totalCopies,
				borrowedBy,
				isAvailable: availableCopies > 0,
			};
		});

		return NextResponse.json({
			users: enrichedUsers,
			books: enrichedBooks,
			query,
		});
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json({ error: "Search failed" }, { status: 500 });
	}
}
