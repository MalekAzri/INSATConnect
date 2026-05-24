import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const url = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Create admin user (ID 1)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@insat.tn' },
    update: {},
    create: {
      id: 1,
      email: 'admin@insat.tn',
      password: 'admin123',
      name: 'Mr. Ahmed',
      role: 'administration',
    },
  });
  console.log('Admin créé:', admin);

  // Create student user (ID 2)
  const student = await prisma.user.upsert({
    where: { email: 'etudiant@insat.tn' },
    update: {},
    create: {
      id: 2,
      email: 'etudiant@insat.tn',
      password: 'etudiant123',
      name: 'Malek',
      role: 'etudiant',
      year: 'GL3',
    },
  });
  console.log('Étudiant créé:', student);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
