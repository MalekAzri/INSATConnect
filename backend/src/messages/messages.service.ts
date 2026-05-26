import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(createMessageDto: CreateMessageDto) {
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: createMessageDto.senderId } }),
      this.prisma.user.findUnique({ where: { id: createMessageDto.receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException(
        'Expéditeur ou destinataire introuvable. Initialisez les utilisateurs (seed Prisma).',
      );
    }

    return this.prisma.message.create({
      data: {
        content: createMessageDto.content,
        senderId: createMessageDto.senderId,
        receiverId: createMessageDto.receiverId,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async getConversation(user1Id: number, user2Id: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async getConversationsList(userId: number) {
    // Finds all unique users this user has messaged or received messages from
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });

    const conversations = new Map<
      number,
      {
        user: { id: number; name: string; role: string };
        lastMessage: (typeof messages)[0];
      }
    >();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversations.has(otherUser.id)) {
        conversations.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg,
        });
      }
    }

    return Array.from(conversations.values());
  }
}
