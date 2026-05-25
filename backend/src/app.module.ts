import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Removed TypeOrmModule import because '@nestjs/typeorm' is not available in this environment
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';

import { AdminAgentModule } from './admin-agent/admin-agent.module';
import { StudentAgentModule } from './student-agent/student-agent.module';
import { StudentGraphqlModule } from './student-graphql/student-graphql.module';

import { Publication } from './admin-agent/publications/entities/publication.entity';
import { AcademicCalendarConfig } from './admin-agent/calendar/entities/academic-calendar.entity';
import { GradeSubmission } from './admin-agent/grades/entities/grade-submission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeOrmModule configuration removed to avoid dependency on '@nestjs/typeorm'

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
      context: ({ req }: { req: unknown }) => ({ req }),
    }),

    UsersModule,
    MessagesModule,
    ChatModule,
    PrismaModule,

    AdminAgentModule,
    StudentAgentModule,
    StudentGraphqlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}