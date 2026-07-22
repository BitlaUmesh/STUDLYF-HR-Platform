const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const students = await prisma.student.findMany({
    include: { githubStats: true, projects: true },
  });
  console.log('✅ STUDENT QUERY SUCCESS, count:', students.length);
}

test()
  .catch((err) => console.error('❌ STUDENT QUERY FAIL:', err))
  .finally(() => prisma.$disconnect());
