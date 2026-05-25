const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.notification.findMany().then(console.log).finally(() => prisma.$disconnect());
