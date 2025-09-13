const fs = require("fs");

// Read the file
const filePath = "/Users/hariprasadsanjel/mini-library/app/admin/transactions/page.js";
let content = fs.readFileSync(filePath, "utf8");

// Find the position of the first "Issue Again" button (the problematic one)
// This is the one that appears right after {!tx.returned ? (
const beforePattern = '{!tx.returned ? (\n\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="flex flex-col gap-2">\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<button';

// We'll replace the entire first button section with just a comment
const buttonStartPattern = /\{!tx\.returned \? \(\s*<div className="flex flex-col gap-2">\s*<button[\s\S]*?return "Issue Again";\s*\}\)\(\)\s*\}\s*<\/button>/;

const replacement = `{!tx.returned ? (
\t\t\t\t\t\t\t\t\t\t\t\t\t/* Books currently borrowed - show only Mark Returned button */
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="flex flex-col gap-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{/* Issue Again button removed - doesn't make sense for borrowed books */}`;

// Apply the replacement
content = content.replace(buttonStartPattern, replacement);

// Write back to file
fs.writeFileSync(filePath, content, "utf8");

console.log("Fixed button logic successfully");
