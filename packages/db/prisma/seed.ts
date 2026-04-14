import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding supermarkets...');
  
  const supermarkets = [
    {
      name: 'Carrefour',
      baseUrl: 'https://www.carrefour.com.ar',
    },
    {
      name: 'Jumbo',
      baseUrl: 'https://www.jumbo.com.ar',
    },
    {
      name: 'Disco',
      baseUrl: 'https://www.disco.com.ar',
    },
  ];

  for (const supermarket of supermarkets) {
    await prisma.supermarket.upsert({
      where: { name: supermarket.name },
      update: {},
      create: supermarket,
    });
    console.log(`Supermarket ${supermarket.name} seeded`);
  }

  console.log('Seeding completed');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });