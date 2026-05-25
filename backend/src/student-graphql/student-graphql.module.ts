import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentResolvers } from './student.resolvers';

@Module({
  imports: [PrismaModule],
  providers: [StudentResolvers],
})
export class StudentGraphqlModule {}
