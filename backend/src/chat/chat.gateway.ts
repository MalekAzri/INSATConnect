import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<number, string>();

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ): void {
    const numId = Number(userId);
    const socketId = client.id;
    console.log(`User ${numId} registered with socket ${socketId}`);
    this.userSockets.set(numId, socketId);
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
      }

      // Emit back to sender to replace optimistic message with real one
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('newMessage', emittedMessage);
      }
    } catch (error) {
      if (senderSocketId) {
        const message = error instanceof Error ? error.message : String(error);
        this.server.to(senderSocketId).emit('chatError', {
          message,
          clientTempId: payload.clientTempId,
        });
      }
    }
  }
}
