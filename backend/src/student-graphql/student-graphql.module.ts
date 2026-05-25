import { Module } from '@nestjs/common';
import { StudentResolvers } from './student.resolvers';

@Module({
  providers: [StudentResolvers],
})
export class StudentGraphqlModule {}
