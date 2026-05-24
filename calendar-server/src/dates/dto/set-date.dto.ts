import { IsDateString, IsNotEmpty } from 'class-validator';

export class SetDatesDto {
  @IsDateString() @IsNotEmpty()
  dsRemise!: string; // date limite remise notes DS

  @IsDateString() @IsNotEmpty()
  examRemise!: string; // date limite remise notes examens

  @IsDateString() @IsNotEmpty()
  dsAffichage!: string; // date affichage notes DS

  @IsDateString() @IsNotEmpty()
  examAffichage!: string; // date affichage notes examens

  @IsDateString() @IsNotEmpty()
  sem1Deliberation!: string; // délibération semestre 1

  @IsDateString() @IsNotEmpty()
  sem2Deliberation!: string; // délibération semestre 2

  @IsDateString() @IsNotEmpty()
  DeliberationFinale!: string; // délibération fin d'année
}