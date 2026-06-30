const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// 1. Load environment variables from .env
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("#")) return;
    const hasEquals = trimmedLine.includes("=");
    const hasColon = trimmedLine.includes(":");
    if (!hasEquals && !hasColon) return;
    const separator = hasEquals ? "=" : ":";
    const [key, ...valueParts] = trimmedLine.split(separator);
    const trimmedKey = key.trim();
    let value = valueParts.join(separator).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[trimmedKey] = value;
  });
  console.log("Successfully loaded environment variables from .env");
} else {
  console.warn(".env file not found at:", envPath);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL is not set!");
  process.exit(1);
}

const sheetsJsonPath = path.join(__dirname, "..", "scratch", "sheets.json");
if (!fs.existsSync(sheetsJsonPath)) {
  console.error(`Error: sheets.json not found at: ${sheetsJsonPath}`);
  console.error("Please upload sheets.json to the 'scratch' directory using Plesk File Manager first.");
  process.exit(1);
}

console.log("Running: npx tsx scripts/import-sheet.ts...");

const escapedDbUrl = dbUrl.replace(/"/g, '\\"');
const cmd = `DATABASE_URL="${escapedDbUrl}" npx tsx scripts/import-sheet.ts`;

const child = spawn(cmd, [], {
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => {
  process.exit(code);
});
