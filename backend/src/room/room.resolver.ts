import { PrismaService } from '../prisma/prisma.service';

const prisma = new PrismaService();

export const resolvers = {
  Query: {
    rooms: async () => {
      return await prisma.room.findMany();
    },

    room: async (_: any, args: any) => {
      return await prisma.room.findUnique({
        where: {
          id: args.id,
        },
        include: {
          posts: true,
          homeworks: true,
        },
      });
    },
  },
};