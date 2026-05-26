import { PublicationCategory } from '../../common/enums/publication-category.enum';

export interface PublicationGradeLine {
  subject: string;
  studentId: string;
  studentName: string;
  examType: string;
  grade: string;
}

export class Publication {
  id!: string;
  title!: string;
  category!: PublicationCategory;
  content!: string;
  author!: string;
  targetYear?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  grades?: PublicationGradeLine[] | null;
  createdAt!: Date;
  updatedAt!: Date;
}
