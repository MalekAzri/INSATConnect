import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.createMessage(createMessageDto);
  }

  // Get conversation between the current user (simulated) and another user
  @Get('conversation/:userId/:otherUserId')
  getConversation(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherUserId', ParseIntPipe) otherUserId: number,
  ) {
    return this.messagesService.getConversation(userId, otherUserId);
  }

  // Get all conversation last messages for a user
  @Get('list/:userId')
  getConversationsList(@Param('userId', ParseIntPipe) userId: number) {
    return this.messagesService.getConversationsList(userId);
  }
}
