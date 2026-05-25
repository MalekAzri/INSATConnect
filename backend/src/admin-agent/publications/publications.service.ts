import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRole } from '../common/enums/notification-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { ListPublicationsQueryDto } from './dto/list-publications.query.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { Publication } from './entities/publication.entity';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationsRepo: Repository<Publication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreatePublicationDto,
    file?: Express.Multer.File,
  ): Promise<Publication> {
    const publication = this.publicationsRepo.create({
      title: dto.title.trim(),
      category: dto.category,
      content: dto.content.trim(),
      author: dto.author?.trim() || 'Scolarité INSAT',
      targetYear: dto.targetYear?.trim().toUpperCase() || null,
      fileName: file?.originalname ?? null,
      filePath: file ? `/uploads/${file.filename}` : null,
      fileSizeBytes: file?.size ?? null,
      grades: dto.grades?.length ? dto.grades : null,
    });

    const saved = await this.publicationsRepo.save(publication);

    this.notificationsService.publish({
      type: 'publication.created',
      role: NotificationRole.ALL,
      message: `Nouvelle publication: ${saved.title}`,
      data: {
        publicationId: saved.id,
        category: saved.category,
        targetYear: saved.targetYear,
      },
    });

    return saved;
  }

  async findAll(query: ListPublicationsQueryDto): Promise<Publication[]> {
    const qb = this.publicationsRepo
      .createQueryBuilder('publication')
      .orderBy('publication.createdAt', 'DESC')
      .skip(query.offset ?? 0)
      .take(query.limit ?? 50);

    if (query.category) {
      qb.andWhere('publication.category = :category', { category: query.category });
    }

    if (query.targetYear) {
      qb.andWhere(
        '(publication.targetYear IS NULL OR UPPER(publication.targetYear) = :targetYear)',
        { targetYear: query.targetYear.trim().toUpperCase() },
      );
    }

    if (query.search) {
      qb.andWhere('(publication.title LIKE :search OR publication.content LIKE :search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Publication> {
    const publication = await this.publicationsRepo.findOne({ where: { id } });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }
    return publication;
  }

  async update(
    id: string,
    dto: UpdatePublicationDto,
    file?: Express.Multer.File,
  ): Promise<Publication> {
    const publication = await this.findOne(id);

    if (dto.title !== undefined) publication.title = dto.title.trim();
    if (dto.category !== undefined) publication.category = dto.category;
    if (dto.content !== undefined) publication.content = dto.content.trim();
    if (dto.author !== undefined) {
      publication.author = dto.author.trim() || 'Scolarité INSAT';
    }
    if (dto.targetYear !== undefined) {
      publication.targetYear = dto.targetYear ? dto.targetYear.trim().toUpperCase() : null;
    }
    if (dto.grades !== undefined) {
      publication.grades = dto.grades?.length ? dto.grades : null;
    }

    if (file) {
      publication.fileName = file.originalname;
      publication.filePath = `/uploads/${file.filename}`;
      publication.fileSizeBytes = file.size;
    }

    return this.publicationsRepo.save(publication);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const publication = await this.findOne(id);
    await this.publicationsRepo.remove(publication);
    return { deleted: true, id };
  }
}
