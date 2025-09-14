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
		<div className="flex flex-col">
			<main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-50 to-white flex flex-col">
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

				{/* Stats Section */}
				<section className="py-16 bg-gray-50">
					<div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 text-center gap-8">
						<div>
							<p className="text-3xl font-bold text-blue-600">500+</p>
							<p className="text-gray-600">Books Available</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-green-600">200+</p>
							<p className="text-gray-600">Active Members</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-purple-600">1K+</p>
							<p className="text-gray-600">Transactions</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-pink-600">100%</p>
							<p className="text-gray-600">Free for All</p>
						</div>
					</div>
				</section>

				{/* Footer */}
				<footer className="py-6 text-center text-gray-500 border-t bg-white">
					<p>© {new Date().getFullYear()} Mini Library. Developed by Hari Prasad Sanjel.</p>
				</footer>
			</main>
		</div>
	);
}
