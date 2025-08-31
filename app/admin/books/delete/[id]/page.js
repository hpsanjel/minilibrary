"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function DeleteBookPage({ params }) {
  // Unwrap params with React.use() for Next.js 15+ dynamic route API
  const unwrappedParams = typeof params?.then === "function" ? React.use(params) : params;

	const router = useRouter();

	useEffect(() => {
		async function deleteBook() {
			await fetch("/api/books", {
				method: "DELETE",
				body: JSON.stringify({ id: parseInt(unwrappedParams.id) }),
			});
			router.push("/admin/books");
		}
		deleteBook();
	}, [unwrappedParams.id, router]);

	return <p className="p-6">Deleting book...</p>;
}
