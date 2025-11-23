#!/usr/bin/env node

// Helper script to check if environment variables are set
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
];

console.log('🔍 Checking environment variables...\n');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('\n📝 Please create .env.local file with the following variables:\n');
  
  console.log('# Supabase Configuration');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://vwfrzzynuolmsfdbxphe.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here');
  console.log('');
  console.log('# Direct PostgreSQL connection');
  console.log('DATABASE_URL=postgresql://postgres:rvQGAMjkJ870rlJ5@db.vwfrzzynuolmsfdbxphe.supabase.co:5432/postgres');
  console.log('');
  console.log('# AI Provider Configuration');
  console.log('GEMINI_API_KEY=your_gemini_api_key');
  console.log('OPENAI_API_KEY=your_openai_api_key');
  console.log('');
  console.log('# App Configuration');
  console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
  console.log('');
  console.log('# Cron Secret');
  console.log('CRON_SECRET=your_random_secret_string');
  
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

let allSet = true;
const missing = [];

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value.includes('your_') || value.includes('paste_')) {
    console.log(`❌ ${varName}: Not set or placeholder value`);
    missing.push(varName);
    allSet = false;
  } else {
    console.log(`✅ ${varName}: Set`);
  }
});

console.log('');

if (allSet) {
  console.log('✅ All required environment variables are set!');
  console.log('\n🚀 You can now run: npm run dev');
} else {
  console.log(`❌ Missing ${missing.length} environment variable(s)`);
  console.log('\n📖 See SETUP.md for instructions on how to get these values.');
  process.exit(1);
}


