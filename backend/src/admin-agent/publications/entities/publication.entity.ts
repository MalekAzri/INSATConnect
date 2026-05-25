import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PublicationCategory } from '../../common/enums/publication-category.enum';

export interface PublicationGradeLine {
  subject: string;
  ds: string;
  exam: string;
  avg: string;
}

@Entity('publications')
export class Publication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({
    type: 'simple-enum',
    enum: PublicationCategory,
    default: PublicationCategory.NOTES,
  })
  category!: PublicationCategory;

  @Column({ type: 'text' })
  content!: string;

  @Column()
  author!: string;

  @Column({ type: 'text', nullable: true })
  targetYear?: string | null;

  @Column({ type: 'text', nullable: true })
  fileName?: string | null;

  @Column({ type: 'text', nullable: true })
  filePath?: string | null;

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes?: number | null;

  @Column({ type: 'simple-json', nullable: true })
  grades?: PublicationGradeLine[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
