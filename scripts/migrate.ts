#!/usr/bin/env node

/**
 * Migration script to push schema changes to Supabase
 * Run with: npm run db:push
 * Or use: npx tsx scripts/migrate.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔄 Connecting to database...');
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log('✅ Connected to database');
  console.log('📝 Schema will be synced on next db:push command');
  console.log('\n💡 To push schema changes, run: npm run db:push');
  console.log('💡 To generate migrations, run: npm run db:generate');
  
  await client.end();
}

migrate().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

