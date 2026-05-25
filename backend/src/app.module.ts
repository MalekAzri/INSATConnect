import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    UsersModule,
    MessagesModule,
    ChatModule,
    PrismaModule,
    AdminAgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
