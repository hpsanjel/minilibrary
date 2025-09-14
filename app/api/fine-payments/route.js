import prisma from "@/lib/prisma";

export async function POST(req) {
	try {
		const body = await req.json();
		const { transactionId, userId, amount, processedBy, notes } = body;

		// Validate required fields
		if (!transactionId || !userId || !amount) {
			return new Response(JSON.stringify({ error: "Missing required fields: transactionId, userId, amount" }), { status: 400 });
		}

		// Create fine payment record
		const finePayment = await prisma.finePayment.create({
			data: {
				transactionId,
				userId,
				amount: parseFloat(amount),
				processedBy: processedBy || "Admin",
				notes: notes || "",
			},
		});

		return new Response(JSON.stringify(finePayment), { status: 201 });
	} catch (error) {
		console.error("Error creating fine payment:", error);
		return new Response(JSON.stringify({ error: "Failed to record fine payment" }), {
			status: 500,
		});
	}
}

export async function GET(req) {
	try {
		// Get fine payments with related data
		const finePayments = await prisma.finePayment.findMany({
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				transaction: {
					include: {
						book: {
							select: {
								id: true,
								title: true,
								author: true,
							},
						},
					},
				},
			},
			orderBy: {
				paidAt: "desc",
			},
		});

		// Calculate summary statistics
		const totalPayments = finePayments.length;
		const totalAmount = finePayments.reduce((sum, payment) => sum + payment.amount, 0);
		const uniqueUsers = new Set(finePayments.map((payment) => payment.userId)).size;

		// Group by month for chart data
		const monthlyData = {};
		finePayments.forEach((payment) => {
			const month = payment.paidAt.toISOString().slice(0, 7); // YYYY-MM format
			if (!monthlyData[month]) {
				monthlyData[month] = { count: 0, amount: 0 };
			}
			monthlyData[month].count++;
			monthlyData[month].amount += payment.amount;
		});

		return new Response(
			JSON.stringify({
				payments: finePayments,
				summary: {
					totalPayments,
					totalAmount,
					uniqueUsers,
					averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0,
				},
				monthlyData,
			})
		);
	} catch (error) {
		console.error("Error fetching fine payments:", error);
		return new Response(JSON.stringify({ error: "Failed to fetch fine payments" }), {
			status: 500,
		});
	}
}
