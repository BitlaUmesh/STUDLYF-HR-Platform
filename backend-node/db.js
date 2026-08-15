/**
 * Supabase Client Configuration
 *
 * Provides direct access to the Supabase JS SDK for features beyond
 * Prisma's ORM scope (Storage, Realtime, Edge Functions, Auth helpers, etc.).
 *
 * Required environment variables:
 *   SUPABASE_URL  — your project URL (e.g. https://xyz.supabase.co)
 *   SUPABASE_KEY  — anon/public key or service_role key depending on use-case
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n' + '='.repeat(80));
  console.error('❌ SUPABASE CLIENT ERROR: Missing environment variables!');
  console.error('   Ensure SUPABASE_URL and SUPABASE_KEY are set in your .env or hosting environment.');
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
