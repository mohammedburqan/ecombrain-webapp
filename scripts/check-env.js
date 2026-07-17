#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

// Verify the environment variables the EcomSkool Companion App needs.
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

console.log("🔍 Checking environment variables...\n");

if (!fs.existsSync(envPath)) {
  console.log("❌ .env.local not found. Copy .env.local.example to .env.local and fill it in.\n");
  process.exit(1);
}

const envVars = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

let ok = true;
for (const name of requiredVars) {
  const value = envVars[name];
  if (!value || value.includes("your_") || value.includes("paste_")) {
    console.log(`❌ ${name}: not set`);
    ok = false;
  } else {
    console.log(`✅ ${name}: set`);
  }
}

console.log("");
if (ok) {
  console.log("✅ All required environment variables are set. Run: npm run dev");
} else {
  console.log("❌ Some variables are missing. See .env.local.example.");
  process.exit(1);
}
