import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { Publication } from './admin-agent/publications/entities/publication.entity';
import { AcademicCalendarConfig } from './admin-agent/calendar/entities/academic-calendar.entity';
import { GradeSubmission } from './admin-agent/grades/entities/grade-submission.entity';
import { StudentGraphqlModule } from './student-graphql/student-graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DATABASE_PATH', './insatconnect.db'),
        entities: [Publication, AcademicCalendarConfig, GradeSubmission],
        synchronize: true,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'], // Schema First approach
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
      context: ({ req }: { req: unknown }) => ({ req }), // Provide req for JWT context
    }),
    UsersModule,
    MessagesModule,
    ChatModule,
    PrismaModule,
    AdminAgentModule,
    StudentGraphqlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
