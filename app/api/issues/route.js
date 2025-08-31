import prisma from "@/lib/prisma";

// Get all issues
export async function GET() {
	const issues = await prisma.issue.findMany({
		orderBy: { createdAt: "desc" },
	});
	return new Response(JSON.stringify(issues));
}

// Create a new issue
export async function POST(req) {
	const { title, description, userId, status } = await req.json();
	const issue = await prisma.issue.create({
		data: { title, description, userId, status },
	});
	return new Response(JSON.stringify(issue));
}

// Update an issue (e.g., status)
export async function PATCH(req) {
	const { id, ...data } = await req.json();
	const issue = await prisma.issue.update({
		where: { id: parseInt(id) },
		data,
	});
	return new Response(JSON.stringify(issue));
}

// Delete an issue
export async function DELETE(req) {
	const { id } = await req.json();
	await prisma.issue.delete({ where: { id: parseInt(id) } });
	return new Response(JSON.stringify({ success: true }));
}
