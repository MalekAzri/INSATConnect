import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';

import { AdminAgentModule } from './admin-agent/admin-agent.module';
import { StudentAgentModule } from './student-agent/student-agent.module';
import { StudentGraphqlModule } from './student-graphql/student-graphql.module';
import { TeacherModule } from './teacher/teacher.module';
import { AuthModule } from './auth/auth.module';

import { Publication } from './admin-agent/publications/entities/publication.entity';
import { AcademicCalendarConfig } from './admin-agent/calendar/entities/academic-calendar.entity';
import { GradeSubmission } from './admin-agent/grades/entities/grade-submission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
      context: ({ req }: { req: unknown }) => ({ req }),
    }),

    MessagesModule,
    ChatModule,
    PrismaModule,

    AdminAgentModule,
    StudentAgentModule,
    StudentGraphqlModule,
    TeacherModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}