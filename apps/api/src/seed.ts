import { prisma } from './db/prisma';

async function main() {
  const product = await prisma.product.create({
    data: {
      name: 'Limited Edition Sneaker',
      stock: 100, // The test scenario says 100 users trying to buy limited stock
    },
  });

  console.log('✅ Created Product:', product);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });