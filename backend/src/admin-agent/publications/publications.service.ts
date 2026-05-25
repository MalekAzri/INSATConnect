import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationRole } from '../common/enums/notification-role.enum';
import { PublicationCategory } from '../common/enums/publication-category.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { ListPublicationsQueryDto } from './dto/list-publications.query.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { Publication } from './entities/publication.entity';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapToEntity(pub: any): Publication {
    return {
      id: pub.id,
      title: pub.title,
      category: pub.category as PublicationCategory,
      content: pub.content,
      author: pub.author,
      targetYear: pub.targetYear,
      fileName: pub.fileName,
      filePath: pub.filePath,
      fileSizeBytes: pub.fileSizeBytes,
      grades: pub.grades ? JSON.parse(pub.grades) : null,
      createdAt: pub.createdAt,
      updatedAt: pub.updatedAt,
    };
  }

  async create(
    dto: CreatePublicationDto,
    file?: Express.Multer.File,
  ): Promise<Publication> {
    const publication = await this.prisma.publication.create({
      data: {
        title: dto.title.trim(),
        category: dto.category,
        content: dto.content.trim(),
        author: dto.author?.trim() || 'Scolarité INSAT',
        targetYear: dto.targetYear?.trim().toUpperCase() || null,
        fileName: file?.originalname ?? null,
        filePath: file ? `/uploads/${file.filename}` : null,
        fileSizeBytes: file?.size ?? null,
        grades: dto.grades?.length ? JSON.stringify(dto.grades) : null,
      },
    });

    const saved = this.mapToEntity(publication);

    await this.notificationsService.publish({
      type: 'publication.created',
      role: NotificationRole.ALL,
      message: `Nouvelle publication: ${saved.title}`,
      targetYear: saved.targetYear,
      data: {
        publicationId: saved.id,
        category: saved.category,
        targetYear: saved.targetYear,
      },
    });

    return saved;
  }

  async findAll(query: ListPublicationsQueryDto): Promise<Publication[]> {
    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.targetYear) {
      where.OR = [
        { targetYear: null },
        { targetYear: { equals: query.targetYear.trim().toUpperCase() } },
      ];
    }

    if (query.search) {
      const search = query.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
          ],
        },
      ];
    }

    const pubs = await this.prisma.publication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.offset ? Number(query.offset) : 0,
      take: query.limit ? Number(query.limit) : 50,
    });

    return pubs.map((p) => this.mapToEntity(p));
  }

  async findOne(id: string): Promise<Publication> {
    const publication = await this.prisma.publication.findUnique({ where: { id } });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }
    return this.mapToEntity(publication);
  }

  async update(
    id: string,
    dto: UpdatePublicationDto,
    file?: Express.Multer.File,
  ): Promise<Publication> {
    // Verify exists
    await this.findOne(id);

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.content !== undefined) data.content = dto.content.trim();
    if (dto.author !== undefined) {
      data.author = dto.author.trim() || 'Scolarité INSAT';
    }
    if (dto.targetYear !== undefined) {
      data.targetYear = dto.targetYear ? dto.targetYear.trim().toUpperCase() : null;
    }
    if (dto.grades !== undefined) {
      data.grades = dto.grades?.length ? JSON.stringify(dto.grades) : null;
    }

    if (file) {
      data.fileName = file.originalname;
      data.filePath = `/uploads/${file.filename}`;
      data.fileSizeBytes = file.size;
    }

    const updated = await this.prisma.publication.update({
      where: { id },
      data,
    });

    return this.mapToEntity(updated);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    await this.findOne(id);
    await this.prisma.publication.delete({ where: { id } });
    return { deleted: true, id };
  }
}
