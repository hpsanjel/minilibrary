"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setOpen(false);
			}
		}
		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	return (
		<nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
			<Link href="/" className="text-xl font-bold tracking-tight">
				Mini Library
			</Link>
			<div className="flex gap-4 items-center relative">
				{session ? (
					<>
						{session.user.role === "ADMIN" && (
							<Link href="/admin/dashboard" className="hover:underline">
								Admin
							</Link>
						)}
						<div className="relative" ref={dropdownRef}>
							<button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="User menu">
								{session.user.photo ? <img src={session.user.photo} alt={session.user.name || session.user.email} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow" /> : <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg border-2 border-white shadow">{session.user.name ? session.user.name.charAt(0).toUpperCase() : session.user.email.charAt(0).toUpperCase()}</span>}
								<svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{open && (
								<div className="absolute right-0 mt-2 w-56 bg-white text-gray-900 rounded-lg shadow-lg z-50 border animate-fade-in">
									<div className="px-4 py-3 border-b">
										<div className="font-semibold text-lg">{session.user.name || "User"}</div>
										<div className="text-sm text-gray-600">{session.user.email}</div>
									</div>
									<button
										onClick={() => {
											setOpen(false);
											signOut({ callbackUrl: "/auth/signin" });
										}}
										className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 font-semibold rounded-b-lg transition"
									>
										Logout
									</button>
								</div>
							)}
						</div>
					</>
				) : (
					<Link href="/auth/signin" className="hover:underline">
						Sign In
					</Link>
				)}
			</div>
		</nav>
	);
}
