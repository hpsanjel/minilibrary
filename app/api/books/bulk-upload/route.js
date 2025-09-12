import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request) {
	try {
		const formData = await request.formData();
		const csvFile = formData.get("csvFile");

		if (!csvFile) {
			return new Response(JSON.stringify({ error: "No CSV file provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Read CSV file content
		const csvText = await csvFile.text();
		const lines = csvText.split("\n").filter((line) => line.trim());

		if (lines.length < 2) {
			return new Response(JSON.stringify({ error: "CSV file must contain header and at least one data row" }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Parse CSV header
		const header = lines[0].split(",").map((col) => col.trim().replace(/"/g, ""));
		const requiredColumns = ["title", "author"];
		const optionalColumns = ["isbn", "copies", "coverUrl"];
		const allowedColumns = [...requiredColumns, ...optionalColumns];

		// Filter out any 'id' column if present (we don't want to set manual IDs)
		const filteredHeader = header.filter((col) => col.toLowerCase() !== "id");

		// Validate header
		const missingRequired = requiredColumns.filter((col) => !filteredHeader.includes(col));
		if (missingRequired.length > 0) {
			return new Response(
				JSON.stringify({
					error: `Missing required columns: ${missingRequired.join(", ")}. Required: ${requiredColumns.join(", ")}`,
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// Process data rows
		const results = {
			successful: 0,
			failed: 0,
			errors: [],
		};

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			try {
				// Parse CSV row (simple CSV parser - handles basic quotes)
				const values = [];
				let current = "";
				let inQuotes = false;

				for (let j = 0; j < line.length; j++) {
					const char = line[j];
					if (char === '"') {
						inQuotes = !inQuotes;
					} else if (char === "," && !inQuotes) {
						values.push(current.trim());
						current = "";
					} else {
						current += char;
					}
				}
				values.push(current.trim()); // Add last value

				// Create book object
				const bookData = {};
				const originalHeaderIndexMap = {};

				// Create a mapping of original header positions
				header.forEach((col, index) => {
					originalHeaderIndexMap[col] = index;
				});

				filteredHeader.forEach((col) => {
					if (allowedColumns.includes(col)) {
						const originalIndex = originalHeaderIndexMap[col];
						let value = values[originalIndex] || "";
						value = value.replace(/^"(.*)"$/, "$1"); // Remove surrounding quotes

						if (col === "copies") {
							bookData[col] = value ? parseInt(value) || 1 : 1;
						} else if (col === "isbn" || col === "coverUrl") {
							bookData[col] = value || null;
						} else {
							bookData[col] = value;
						}
					}
				});

				// Validate required fields
				if (!bookData.title || !bookData.author) {
					results.errors.push({
						row: i + 1,
						error: "Title and author are required",
					});
					results.failed++;
					continue;
				}

				// Set default values
				if (!bookData.copies || bookData.copies < 1) {
					bookData.copies = 1;
				}

				// Create book in database
				try {
					await prisma.book.create({
						data: {
							title: bookData.title,
							author: bookData.author,
							isbn: bookData.isbn,
							copies: bookData.copies,
							available: bookData.copies > 0,
							coverUrl: bookData.coverUrl,
						},
					});
					results.successful++;
				} catch (dbError) {
					console.error("Database error for row", i + 1, ":", dbError);

					// If it's a unique constraint error on id, try to reset the sequence
					if (dbError.code === "P2002" && dbError.meta?.target?.includes("id")) {
						try {
							// Get the maximum ID and reset sequence
							const maxBook = await prisma.book.findFirst({
								orderBy: { id: "desc" },
								select: { id: true },
							});
							const maxId = maxBook ? maxBook.id : 0;
							const nextId = maxId + 1;

							// Reset the PostgreSQL sequence
							await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Book"', 'id'), ${nextId}, false);`;

							// Try creating the book again
							await prisma.book.create({
								data: {
									title: bookData.title,
									author: bookData.author,
									isbn: bookData.isbn,
									copies: bookData.copies,
									available: bookData.copies > 0,
									coverUrl: bookData.coverUrl,
								},
							});
							results.successful++;
						} catch (retryError) {
							console.error("Retry after sequence reset failed:", retryError);
							results.errors.push({
								row: i + 1,
								error: `Database error: ${retryError.message}`,
							});
							results.failed++;
						}
					} else {
						results.errors.push({
							row: i + 1,
							error: `Database error: ${dbError.message}`,
						});
						results.failed++;
					}
				}
			} catch (error) {
				console.error("Row parsing error for row", i + 1, ":", error);
				results.errors.push({
					row: i + 1,
					error: `Parsing error: ${error.message || "Failed to process row"}`,
				});
				results.failed++;
			}
		}

		const status = results.failed > 0 ? 207 : 200; // 207 = Multi-Status
		return new Response(
			JSON.stringify({
				message: `Upload completed. ${results.successful} successful, ${results.failed} failed.`,
				...results,
			}),
			{ status, headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		console.error("CSV upload error:", error);
		return new Response(JSON.stringify({ error: "Failed to process CSV file" }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}
