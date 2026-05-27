import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';

import { AdminAgentModule } from './admin-agent/admin-agent.module';
import { StudentAgentModule } from './student-agent/student-agent.module';
import { TeacherModule } from './teacher/teacher.module';
import { TeacherService } from './teacher/teacher.service';
import { AuthModule } from './auth/auth.module';
import { createApolloResolvers } from './graphql-resolvers/general-resolvers';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [PrismaModule, TeacherModule],
      inject: [PrismaService, TeacherService],
      useFactory: (
        prismaService: PrismaService,
        teacherService: TeacherService,
      ) => ({
        typePaths: ['./**/*.graphql'],
        definitions: {
          path: join(process.cwd(), 'src/graphql.ts'),
          outputAs: 'class',
        },
        context: ({ req }: { req: unknown }) => ({ req }),
        resolvers: createApolloResolvers(prismaService, teacherService),
      }),
    }),

    MessagesModule,
    ChatModule,
    PrismaModule,

    AdminAgentModule,
    StudentAgentModule,
    TeacherModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
