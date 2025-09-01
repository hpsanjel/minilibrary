import Link from "next/link";
import Image from "next/image";
// import { BookOpen } from "lucide-react";
export default function BookCard({ book }) {
	return (
		<article className="relative flex flex-col justify-between h-full bg-white border rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] transition-shadow duration-300 overflow-hidden" aria-label={`Book: ${book.title}`}>
			{/* Accent bar */}
			<div className={`absolute top-0 left-0 w-full h-1 ${book.available ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true"></div>

			{/* Copies badge */}
			<div className="absolute top-3 right-3 z-10">
				<span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${book.copies > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-500"}`} title="Copies available">
					{book.copies} {book.copies === 1 ? "copy" : "copies"} available
				</span>
			</div>

			{/* Cover Image */}
			<div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
				{book.coverUrl ? (
					<Image src={book.coverUrl} alt={`Cover of ${book.title}`} width={192} height={192} className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105" />
				) : (
					<div className="flex flex-col items-center justify-center text-gray-400">
						{/* <Use className="w-10 h-10 mb-1" /> */}
						<span className="text-xs">No Cover</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex flex-col flex-1 justify-between p-5">
				{/* Top Section */}
				<div className="">
					<h2 className="text-lg font-bold text-gray-900 line-clamp-2">{book.title}</h2>
					<p className="text-sm text-gray-700">
						by <span className="font-medium">{book.author}</span>
					</p>
				</div>

				{/* Bottom Action */}

				<div className="mt-4">
					{book.available ? (
						<Link href={`/books/borrow/${book.id}`} className="block w-full text-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
							Borrow Now
						</Link>
					) : (
						<button disabled className="block w-full text-center bg-gray-200 text-gray-500 text-sm font-medium px-4 py-2 rounded-xl cursor-not-allowed" aria-disabled="true">
							Unavailable Now
						</button>
					)}
				</div>
			</div>
		</article>
	);
}
