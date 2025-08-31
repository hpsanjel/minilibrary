import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }) {
	const session = await getServerSession(authOptions);
	if (!session || session.user.role !== "ADMIN") {
		redirect("/");
	}
	return (
		<div className="flex">
			<AdminSidebar />
			<div className="flex-1 p-6">{children}</div>
		</div>
	);
}
