import { prisma } from './db/prisma';

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'frontend-wizard@test.com', // A real user!
    },
  });

  console.log('✅ Created User:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });