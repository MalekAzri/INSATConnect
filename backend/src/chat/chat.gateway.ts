import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // We can store a map of userId -> socketId if we want to send direct messages
  // Since authentication is mocked, users might send their ID upon connection
  private userSockets = new Map<number, string>();

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    // Usually, you would get the user ID from the JWT token here
    // For now, we wait for an explicit "register" event to map userId to socketId
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove the socket from our mapping
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    console.log(`User ${userId} registered with socket ${client.id}`);
    this.userSockets.set(userId, client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: { senderId: number; receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 1. Save message to database
    const savedMessage = await this.messagesService.createMessage({
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      content: payload.content,
    });

    // 2. Emit the message to the receiver if they are connected
    const receiverSocketId = this.userSockets.get(payload.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', savedMessage);
    }

    // 3. Optionally emit back to sender (for acknowledgment)
    return savedMessage; 
  }
}
