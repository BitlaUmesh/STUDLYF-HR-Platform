const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'umeshscs503130@gmail.com' },
    update: { hashedPassword: hash },
    create: {
      fullName: 'Bitla Umesh Kumar',
      email: 'umeshscs503130@gmail.com',
      hashedPassword: hash,
      companyName: 'STUDLYF',
      branding: { create: {} },
    },
  });
  console.log('✅ User account ready:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
