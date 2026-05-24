import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UsersModule, MessagesModule, ChatModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
