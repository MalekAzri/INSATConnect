import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  // Create teacher user (ID 3)
  const teacher = await prisma.user.upsert({
    where: { email: 'm.slim@insat.u-cartago.tn' },
    update: {},
    create: {
      id: 3,
      email: 'm.slim@insat.u-cartago.tn',
      password: 'teacher123',
      name: 'Dr. Mohamed Slim',
      role: 'teacher',
    },
  });
  console.log('Enseignant créé:', teacher);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
