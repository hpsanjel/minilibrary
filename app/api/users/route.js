import prisma from "@/lib/prisma";

// Get all users
export async function GET() {
	const users = await prisma.user.findMany({
		select: { id: true, name: true, email: true, phone: true, city: true, postalCode: true, address: true, role: true, verifiedUser: true },
	});
	return new Response(JSON.stringify(users));
}

// Create a new user
export async function POST(req) {
	const { name, email, password, phone, city, postalCode, address, role } = await req.json();
	// You should hash the password in production!
	const user = await prisma.user.create({
		data: { name, email, password, phone, city, postalCode, address, role, verifiedUser: "No" },
	});
	return new Response(JSON.stringify(user));
}

// Update user (name, contact, role)
export async function PATCH(req) {
	const { id, name, phone, city, postalCode, address, role, verifiedUser } = await req.json();
	const data = { name, phone, city, postalCode, address, role };
	if (verifiedUser !== undefined) data.verifiedUser = verifiedUser;
	const user = await prisma.user.update({
		where: { id: parseInt(id) },
		data,
	});
	return new Response(JSON.stringify(user));
}

// Delete user
export async function DELETE(req) {
	const { id } = await req.json();
	const userId = parseInt(id);
	await prisma.transaction.deleteMany({ where: { userId } });
	await prisma.user.delete({ where: { id: userId } });
	return new Response(JSON.stringify({ success: true }));
}
