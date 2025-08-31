import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
	const hash = await bcrypt.hash("admin123", 10);
	await prisma.user.upsert({
		where: { email: "admin@library.com" },
		update: {},
		create: { email: "admin@library.com", password: hash, role: "ADMIN", name: "Admin" },
	});

	await prisma.book.createMany({
		data: [
			{ title: "1984", author: "George Orwell", isbn: "9780451524935", copies: 3 },
			{ title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", copies: 2 },
			{ title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", copies: 1 },
		],
	});
}

main()
	.catch((e) => console.error(e))
	.finally(() => prisma.$disconnect());
