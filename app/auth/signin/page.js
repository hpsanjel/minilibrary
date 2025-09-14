"use client";

import AuthForm from "@/components/AuthForm";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
	return <AuthForm />;
}

export default function AuthPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SignInContent />
		</Suspense>
	);
}
