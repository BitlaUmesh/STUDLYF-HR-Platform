const { PrismaClient } = require('@prisma/client');

function createPrismaClient() {
  if (global.prisma) return global.prisma;

  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ CRITICAL DEPLOYMENT WARNING: Missing DATABASE_URL environment variable!');
    console.error('   The backend requires a PostgreSQL database URL to perform database operations.');
    console.error('   Please add DATABASE_URL in your Hostinger App Settings -> Environment Variables.');
    console.error('='.repeat(80) + '\n');
  }

  try {
    const client = new PrismaClient(
      !dbUrl ? { datasources: { db: { url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder' } } } : {}
    );
    if (process.env.ENVIRONMENT !== 'production') {
      global.prisma = client;
    }
    return client;
  } catch (err) {
    console.error('❌ Failed to construct PrismaClient:', err.message);
    const fallbackClient = new PrismaClient();
    return fallbackClient;
  }
}

const prisma = createPrismaClient();

module.exports = prisma;

