"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const { data: session } = useSession();
	const user = session?.user;
	const router = useRouter();

	useEffect(() => {
		if (user?.role === "ADMIN") {
			router.replace("/admin/dashboard");
		}
	}, [user, router]);

	return (
		<main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
			{/* Hero Section */}
			<section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
				<h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
					Welcome to <span className="text-blue-600">Mini Library</span>
				</h1>
				<p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8">Your all-in-one digital library management system. Borrow books, track transactions, and manage your library with ease.</p>

				<div className="flex gap-4">
					{user ? (
						<>
							<Link href="/books" className="px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400">
								Browse Books
							</Link>
							{user.role === "ADMIN" && (
								<Link href="/admin/dashboard" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-900 text-lg font-medium hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-400">
									Go to Dashboard
								</Link>
							)}
						</>
					) : (
						<>
							<Link href="/auth/signin" className="px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400">
								Get Started
							</Link>
							<Link href="/books" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-900 text-lg font-medium hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-400">
								Browse Books
							</Link>
						</>
					)}
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-white">
				<div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
					<div className="p-6 rounded-2xl shadow-md hover:shadow-lg transition bg-blue-50">
						<h3 className="text-xl font-semibold mb-3 text-blue-700">📚 Easy Book Management</h3>
						<p className="text-gray-600">Add, edit, and organize books in your library with just a few clicks.</p>
					</div>
					<div className="p-6 rounded-2xl shadow-md hover:shadow-lg transition bg-green-50">
						<h3 className="text-xl font-semibold mb-3 text-green-700">👩‍🎓 Student-Friendly</h3>
						<p className="text-gray-600">Browse available books, borrow instantly, and track your reading history.</p>
					</div>
					<div className="p-6 rounded-2xl shadow-md hover:shadow-lg transition bg-purple-50">
						<h3 className="text-xl font-semibold mb-3 text-purple-700">📊 Admin Dashboard</h3>
						<p className="text-gray-600">Get insights into books, users, and transactions with a modern dashboard.</p>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-16 bg-gray-50">
				<div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 text-center gap-8">
					<div>
						<p className="text-3xl font-bold text-blue-600">500+</p>
						<p className="text-gray-600">Books Available</p>
					</div>
					<div>
						<p className="text-3xl font-bold text-green-600">200+</p>
						<p className="text-gray-600">Active Students</p>
					</div>
					<div>
						<p className="text-3xl font-bold text-purple-600">1K+</p>
						<p className="text-gray-600">Transactions</p>
					</div>
					<div>
						<p className="text-3xl font-bold text-pink-600">100%</p>
						<p className="text-gray-600">Free & Open Source</p>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="py-20 bg-white">
				<h2 className="text-3xl font-bold text-center mb-10 text-gray-900">What Our Users Say</h2>
				<div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 px-6">
					<div className="p-6 bg-gray-50 rounded-xl shadow-md">
						<p className="text-gray-600 mb-4">&quot;This library system made borrowing so easy! No paperwork, just click and borrow.&quot;</p>
						<p className="font-semibold">– Sarah, Student</p>
					</div>
					<div className="p-6 bg-gray-50 rounded-xl shadow-md">
						<p className="text-gray-600 mb-4">&quot;Managing books and users is now effortless. The dashboard is a lifesaver!&quot;</p>
						<p className="font-semibold">– Mr. John, Librarian</p>
					</div>
					<div className="p-6 bg-gray-50 rounded-xl shadow-md">
						<p className="text-gray-600 mb-4">&quot;The UI is so clean and easy to use. I wish all school systems were like this.&quot;</p>
						<p className="font-semibold">– Alex, Teacher</p>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-20 bg-gray-50">
				<h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Frequently Asked Questions</h2>
				<div className="max-w-4xl mx-auto space-y-6 px-6">
					<div className="p-4 bg-white rounded-xl shadow">
						<h3 className="font-semibold text-lg mb-2 text-gray-900">Is this library free to use?</h3>
						<p className="text-gray-600">✅ Yes! It’s completely free and open-source.</p>
					</div>
					<div className="p-4 bg-white rounded-xl shadow">
						<h3 className="font-semibold text-lg mb-2 text-gray-900">Can admins add books?</h3>
						<p className="text-gray-600">✅ Yes, admins can add, edit, and remove books easily.</p>
					</div>
					<div className="p-4 bg-white rounded-xl shadow">
						<h3 className="font-semibold text-lg mb-2 text-gray-900">Do students need to register?</h3>
						<p className="text-gray-600">✅ Yes, students must sign up to borrow books.</p>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to explore the library?</h2>
				<p className="mb-6 text-lg text-blue-100">{user ? "Start reading today!" : "Join now and manage your library smarter."}</p>
				{user ? (
					<Link href="/books" className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow-md hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-400">
						Go to Books
					</Link>
				) : (
					<Link href="/auth/signin" className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow-md hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-400">
						Sign In
					</Link>
				)}
			</section>

			{/* Footer */}
			<footer className="py-6 text-center text-gray-500 border-t bg-white">
				<p>© {new Date().getFullYear()} Mini Library. Built with Next.js & Prisma.</p>
			</footer>
		</main>
	);
}
