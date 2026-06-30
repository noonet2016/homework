const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Find .env file in the application root (one level up from scripts/)
const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    // Skip comments and empty lines
    if (line.trim().startsWith("#") || !line.includes("=")) return;
    
    const [key, ...valueParts] = line.split("=");
    const trimmedKey = key.trim();
    let value = valueParts.join("=").trim();
    
    // Remove surrounding quotes if present
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

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in process.env or .env file!");
  process.exit(1);
}

console.log("Running: npx prisma db push...");

const child = spawn("npx", ["prisma", "db", "push"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("close", (code) => {
  process.exit(code);
});
