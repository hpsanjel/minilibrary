import prisma from "@/lib/prisma";
import JSZip from "jszip";

export async function POST(request) {
	try {
		const formData = await request.formData();
		const zipFile = formData.get("csvFile"); // Keep same form field name for compatibility

		if (!zipFile) {
			return new Response(JSON.stringify({ error: "No ZIP file provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Load ZIP file
		const zipBuffer = await zipFile.arrayBuffer();
		const zip = await JSZip.loadAsync(zipBuffer);

		// Find CSV file in ZIP (look for .csv extension)
		const csvFileName = Object.keys(zip.files).find((name) => name.toLowerCase().endsWith(".csv") && !name.startsWith("__MACOSX"));

		if (!csvFileName) {
			return new Response(JSON.stringify({ error: "No CSV file found in ZIP. Please include a .csv file." }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Read CSV content
		const csvText = await zip.files[csvFileName].async("text");
		const lines = csvText.split("\n").filter((line) => line.trim());

		if (lines.length < 2) {
			return new Response(JSON.stringify({ error: "CSV file must contain header and at least one data row" }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Parse CSV header
		const header = lines[0].split(",").map((col) => col.trim().replace(/"/g, ""));
		const requiredColumns = ["title", "author"];
		const optionalColumns = ["isbn", "copies", "imageFileName"];
		const allowedColumns = [...requiredColumns, ...optionalColumns];

		// Filter out any 'id' column if present
		const filteredHeader = header.filter((col) => col.toLowerCase() !== "id");

		// Validate header
		const missingRequired = requiredColumns.filter((col) => !filteredHeader.includes(col));
		if (missingRequired.length > 0) {
			return new Response(JSON.stringify({ error: `Missing required columns: ${missingRequired.join(", ")}. Required: ${requiredColumns.join(", ")}` }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Extract all images from ZIP and convert to base64
		const imageMap = {};
		for (const fileName in zip.files) {
			const file = zip.files[fileName];
			// Skip directories and system files
			if (file.dir || fileName.startsWith("__MACOSX") || fileName.endsWith(".csv")) continue;

			// Check if it's an image file
			const ext = fileName.toLowerCase().split(".").pop();
			if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
				try {
					const imageBuffer = await file.async("uint8array");
					const base64 = Buffer.from(imageBuffer).toString("base64");
					const mimeType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";
					const base64Image = `data:${mimeType};base64,${base64}`;

					// Store with just the filename (no path)
					const justFileName = fileName.split("/").pop();
					imageMap[justFileName] = base64Image;
				} catch (imgError) {
					console.error(`Failed to process image ${fileName}:`, imgError);
				}
			}
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

				let imageFileName = null;

				filteredHeader.forEach((col) => {
					if (allowedColumns.includes(col)) {
						const originalIndex = originalHeaderIndexMap[col];
						let value = values[originalIndex] || "";
						value = value.replace(/^"(.*)"$/, "$1"); // Remove surrounding quotes

						if (col === "copies") {
							bookData[col] = value ? parseInt(value) || 1 : 1;
						} else if (col === "isbn") {
							bookData[col] = value || null;
						} else if (col === "imageFileName") {
							imageFileName = value || null;
						} else {
							bookData[col] = value;
						}
					}
				});

				// Match image from ZIP
				let coverImage = null;
				if (imageFileName && imageMap[imageFileName]) {
					coverImage = imageMap[imageFileName];
				}

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
							coverUrl: coverImage, // Store base64 image
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
									coverUrl: coverImage,
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
		console.error("ZIP upload error:", error);
		return new Response(JSON.stringify({ error: `Failed to process ZIP file: ${error.message}` }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}
