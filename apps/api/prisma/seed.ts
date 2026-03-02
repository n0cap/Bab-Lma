import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Test clients
  const client1 = await prisma.user.upsert({
    where: { email: 'client1@babloo.test' },
    update: {},
    create: {
      email: 'client1@babloo.test',
      phone: '+212661000001',
      passwordHash,
      fullName: 'Yasmine Benali',
      role: 'client',
      locale: 'fr',
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'client2@babloo.test' },
    update: {},
    create: {
      email: 'client2@babloo.test',
      phone: '+212661000002',
      passwordHash,
      fullName: 'Karim Alaoui',
      role: 'client',
      locale: 'fr',
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'client3@babloo.test' },
    update: {},
    create: {
      email: 'client3@babloo.test',
      phone: '+212661000003',
      passwordHash,
      fullName: 'Nour El Idrissi',
      role: 'client',
      locale: 'fr',
    },
  });

  // Test professionals
  const proUser1 = await prisma.user.upsert({
    where: { email: 'pro1@babloo.test' },
    update: {},
    create: {
      email: 'pro1@babloo.test',
      phone: '+212661000011',
      passwordHash,
      fullName: 'Fatima Zahra',
      role: 'pro',
      locale: 'fr',
    },
  });

  const proUser2 = await prisma.user.upsert({
    where: { email: 'pro2@babloo.test' },
    update: {},
    create: {
      email: 'pro2@babloo.test',
      phone: '+212661000012',
      passwordHash,
      fullName: 'Amina Berrada',
      role: 'pro',
      locale: 'fr',
    },
  });

  const proUser3 = await prisma.user.upsert({
    where: { email: 'pro3@babloo.test' },
    update: {},
    create: {
      email: 'pro3@babloo.test',
      phone: '+212661000013',
      passwordHash,
      fullName: 'Rachid Mouline',
      role: 'pro',
      locale: 'fr',
    },
  });

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@babloo.test' },
    update: {},
    create: {
      email: 'admin@babloo.test',
      phone: '+212661000099',
      passwordHash,
      fullName: 'Admin Babloo',
      role: 'admin',
      locale: 'fr',
    },
  });

  // Create Professional profiles
  await prisma.professional.upsert({
    where: { userId: proUser1.id },
    update: {},
    create: {
      userId: proUser1.id,
      skills: ['menage', 'cuisine'],
      bio: 'Professionnelle expérimentée en ménage et cuisine.',
      rating: 4.8,
      totalSessions: 127,
      reliability: 97,
      zones: ['agdal', 'hay_riad', 'hassan'],
      isAvailable: true,
    },
  });

  await prisma.professional.upsert({
    where: { userId: proUser2.id },
    update: {},
    create: {
      userId: proUser2.id,
      skills: ['menage', 'childcare'],
      bio: 'Spécialisée garde d\'enfants et ménage.',
      rating: 4.6,
      totalSessions: 89,
      reliability: 95,
      zones: ['agdal', 'sale_medina', 'tabriquet'],
      isAvailable: true,
    },
  });

  await prisma.professional.upsert({
    where: { userId: proUser3.id },
    update: {},
    create: {
      userId: proUser3.id,
      skills: ['cuisine'],
      bio: 'Chef à domicile, cuisine marocaine traditionnelle.',
      rating: 4.9,
      totalSessions: 64,
      reliability: 99,
      zones: ['agdal', 'hay_riad'],
      isAvailable: true,
    },
  });

  console.log('Seed complete.');
  console.log('Test accounts (password: password123):');
  console.log('  Clients: client1@babloo.test, client2@babloo.test, client3@babloo.test');
  console.log('  Pros: pro1@babloo.test, pro2@babloo.test, pro3@babloo.test');
  console.log('  Admin: admin@babloo.test');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
