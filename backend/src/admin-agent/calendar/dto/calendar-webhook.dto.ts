import { IsIn, IsInt, IsString, Min } from 'class-validator';

export class CalendarWebhookDto {
  @IsString()
  @IsIn(['ds_remise', 'exam_remise', 'ds_affichage', 'exam_affichage', 'sem1_deliberation', 'sem2_deliberation', 'final_deliberation'])
  type!: string;

  @IsString()
  targetRole!: string;

  @IsString()
  date!: string;

  @IsInt()
  @Min(0)
  daysLeft!: number;
}
