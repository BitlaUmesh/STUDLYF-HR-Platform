const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeSeed() {
  try {
    console.log('🔍 Checking database status...');
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      console.log(`✅ Database already contains ${userCount} user record(s). Skipping initial seeding to protect existing data.`);
      return;
    }

    console.log('🌱 Empty database detected! Executing initial seed...');
    // Execute standard seed logic safely
    require('./seed.js');
  } catch (error) {
    console.error('⚠️ Safe seed encountered an error (continuing app startup):', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

safeSeed();
