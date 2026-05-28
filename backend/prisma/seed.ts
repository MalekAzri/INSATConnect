import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ?? 'file:./dev.db',
    },
  },
});

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const studentHash = await bcrypt.hash('etudiant123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const student2Hash = await bcrypt.hash('student456', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@insat.tn' },
    update: {},
    create: {
      id: 1,
      email: 'admin@insat.tn',
      password: adminHash,
      name: 'Mr. Ahmed',
      role: 'administration',
    },
  });

  console.log('Admin OK:', admin.email);

  // Student 1
  const student = await prisma.user.upsert({
    where: { email: 'etudiant@insat.tn' },
    update: {},
    create: {
      id: 2,
      email: 'etudiant@insat.tn',
      password: studentHash,
      name: 'Malek',
      role: 'etudiant',
      year: 'GL3',
    },
  });

  console.log('Étudiant 1 OK:', student.email);

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'm.slim@insat.u-cartago.tn' },
    update: {},
    create: {
      id: 3,
      email: 'm.slim@insat.u-cartago.tn',
      password: teacherHash,
      name: 'Dr. Mohamed Slim',
      role: 'teacher',
    },
  });

  console.log('Enseignant OK:', teacher.email);

  // Student 2
  const student2 = await prisma.user.upsert({
    where: { email: 'sarra@insat.tn' },
    update: {},
    create: {
      id: 4,
      email: 'sarra@insat.tn',
      password: student2Hash,
      name: 'Sarra',
      role: 'etudiant',
      year: 'RT2',
    },
  });

  console.log('Étudiant 2 OK:', student2.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });