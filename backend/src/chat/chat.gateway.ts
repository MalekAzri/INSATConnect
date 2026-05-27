import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<number, string>();

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ): void | Promise<void> {
    const numId = Number(userId);
    if (!numId) return; // rejette les IDs invalides (0, null, NaN)
    const socketId = client.id;
    this.logger.log(`User ${numId} registered with socket ${socketId}`);
    this.userSockets.set(numId, socketId);

    void this.deliverPendingMessages(numId, socketId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    payload: {
      senderId: number;
      receiverId: number;
      content: string;
      clientTempId?: number;
    },
  ) {
    const senderId = Number(payload.senderId);
    const receiverId = Number(payload.receiverId);
    const senderSocketId = this.userSockets.get(senderId);

    try {
      const savedMessage = await this.messagesService.createMessage({
        senderId,
        receiverId,
        content: payload.content,
      });

      const emittedMessage = {
        ...savedMessage,
        clientTempId: payload.clientTempId,
      };

      // Emit to receiver
      const receiverSocketId = this.userSockets.get(receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newMessage', emittedMessage);
        await this.messagesService.markMessagesDelivered([savedMessage.id]);
      } else {
        this.logger.warn(`Receiver ${receiverId} not connected — message saved to DB but not delivered in real-time`);
      }

      // Emit back to sender to replace optimistic message with real one
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('newMessage', emittedMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`sendMessage error: ${message}`);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('chatError', {
          message,
          clientTempId: payload.clientTempId,
        });
      }
    }
  }

  private async deliverPendingMessages(
    userId: number,
    socketId: string,
  ): Promise<void> {
    try {
      const pendingMessages =
        await this.messagesService.getPendingMessagesForReceiver(userId);
      if (!pendingMessages.length) return;

      for (const pending of pendingMessages) {
        this.server.to(socketId).emit('newMessage', pending);
      }

      await this.messagesService.markMessagesDelivered(
        pendingMessages.map((message) => message.id),
      );

      this.logger.log(
        `Delivered ${pendingMessages.length} pending message(s) to user ${userId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`deliverPendingMessages error: ${message}`);
    }
  }
}
