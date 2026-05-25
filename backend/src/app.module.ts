import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminAgentModule } from './admin-agent/admin-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
