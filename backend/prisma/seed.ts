import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const studentHash = await bcrypt.hash('etudiant123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);

  // Create admin user (ID 1)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@insat.tn' },
    update: { password: adminHash },
    create: {
      id: 1,
      email: 'admin@insat.tn',
      password: adminHash,
      name: 'Mr. Ahmed',
      role: 'administration',
    },
  });
  console.log('Admin créé:', admin);

  // Create student user (ID 2)
  const student = await prisma.user.upsert({
    where: { email: 'etudiant@insat.tn' },
    update: { password: studentHash },
    create: {
      id: 2,
      email: 'etudiant@insat.tn',
      password: studentHash,
      name: 'Malek',
      role: 'etudiant',
      year: 'GL3',
    },
  });
  console.log('Étudiant créé:', student);

  // Create teacher user (ID 3)
  const teacher = await prisma.user.upsert({
    where: { email: 'm.slim@insat.u-cartago.tn' },
    update: { password: teacherHash },
    create: {
      id: 3,
      email: 'm.slim@insat.u-cartago.tn',
      password: teacherHash,
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
