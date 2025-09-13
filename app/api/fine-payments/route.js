import prisma from "@/lib/prisma";

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
