"use client";

// import TransactionHistorySidebar from "@/components/TransactionHistorySidebar";
import BooksExplorer from "@/components/BooksExplorer";
import { useSession } from "next-auth/react";

export default function BooksPageClient({ books }) {
	// const { data: session } = useSession();
	return (
		<div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row">
			{/* {session && (
				<div className="md:w-1/4 mb-6 md:mb-0 md:mr-8">
					<TransactionHistorySidebar />
				</div>
			)} */}
			<div className="flex-1">
				<h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Explore Books</h1>
				<BooksExplorer books={books} />
			</div>
		</div>
	);
}
