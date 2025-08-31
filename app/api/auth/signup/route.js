import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req) {
	try {
		const { name, email, password, phone, city, postalCode, address } = await req.json();
		if (!name || !email || !password) {
			return new Response(JSON.stringify({ error: "Name, email, and password are required" }), { status: 400 });
		}
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return new Response(JSON.stringify({ error: "Email already in use" }), { status: 400 });
		}
		const hashed = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: { name, email, password: hashed, phone, city, postalCode, address },
		});
		return new Response(JSON.stringify({ id: user.id, email: user.email, name: user.name }), { status: 201 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Signup failed" }), { status: 500 });
	}
}
