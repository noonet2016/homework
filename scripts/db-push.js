const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Find .env file in the application root (one level up from scripts/)
const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, "utf8");
  // Strip UTF-8 BOM if present
  if (envContent.startsWith("\uFEFF")) {
    envContent = envContent.slice(1);
  }
  
  const loadedKeys = [];
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    // Skip comments and empty lines
    if (trimmedLine.startsWith("#") || !trimmedLine.includes("=")) return;
    
    const [key, ...valueParts] = trimmedLine.split("=");
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
    loadedKeys.push(trimmedKey);
  });
  console.log("Successfully loaded environment variables from .env. Keys:", loadedKeys);
} else {
  console.warn(".env file not found at:", envPath);
}

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in process.env or .env file!");
  console.log("Available environment keys:", Object.keys(process.env).filter(k => !k.startsWith("npm_") && k.length < 30));
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
