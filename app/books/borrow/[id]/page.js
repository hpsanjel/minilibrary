import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function BorrowBookPage(props) {
	// Await params if it's a Promise (Next.js 15+)
	const { params } = props;
	const awaitedParams = typeof params?.then === "function" ? await params : params;
	const session = await getServerSession(authOptions);
	if (!session) redirect("/auth/signin");

	const bookId = parseInt(awaitedParams.id);
	const book = await prisma.book.findUnique({ where: { id: bookId } });
	if (!book) return <p className="p-6">Book not found.</p>;
	if (!book.available || book.copies < 1) return <p className="p-6">Book is not available.</p>;

	// Ensure userId is a number
	const userId = typeof session.user.id === "number" ? session.user.id : parseInt(session.user.id);
	if (!userId || isNaN(userId)) return <p className="p-6">Invalid user session.</p>;

	// Check if user exists
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return <p className="p-6">User not found.</p>;
	if (user.verifiedUser !== "Yes") {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
				<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
					<h2 className="text-xl font-bold mb-4 text-red-600">Become a verified user</h2>
					<p className="mb-4">
						Only verified users can borrow books.
						<br />
						Please contact the admin to verify your account.
					</p>
					<a href="/books" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
						Go Back
					</a>
				</div>
			</div>
		);
	}

	// Check how many books the user currently has borrowed (not returned)
	const activeBorrows = await prisma.transaction.count({
		where: {
			userId,
			returned: false,
		},
	});
	if (activeBorrows >= 2) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
				<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
					<h2 className="text-xl font-bold mb-4 text-red-600">Borrow Limit Reached</h2>
					<p className="mb-4">
						You can only borrow a maximum of 2 books at a time.
						<br />
						Please return a book before borrowing another.
					</p>
					<a href="/books" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
						Go Back
					</a>
				</div>
			</div>
		);
	}

	// Set deadline to 30 days from now
	const deadline = new Date();
	deadline.setDate(deadline.getDate() + 30);
	await prisma.transaction.create({ data: { userId, bookId, deadline } });
	// Decrement copies and update availability
	const updatedBook = await prisma.book.update({
		where: { id: bookId },
		data: {
			copies: { decrement: 1 },
		},
	});
	if (updatedBook.copies <= 0 && updatedBook.available) {
		await prisma.book.update({ where: { id: bookId }, data: { available: false } });
	}
	// Show completion message instead of redirect
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
			<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
				<h2 className="text-xl font-bold mb-4 text-green-600">Borrowing Complete</h2>
				<p className="mb-4">
					You have successfully borrowed the book.
					<br />
					Please return it by <b>{deadline.toLocaleDateString()}</b>.
				</p>
				<a href="/books" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
					Go to Books
				</a>
			</div>
		</div>
	);
}
