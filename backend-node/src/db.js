const { PrismaClient } = require('@prisma/client');

const prisma = global.prisma || new PrismaClient();

if (process.env.ENVIRONMENT !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;
