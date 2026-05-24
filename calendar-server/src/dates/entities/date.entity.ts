import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Date {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  key!: string; // ex: 'remise_ds', 'remise_examen', etc.

  @Column({ type: 'date' })
  date!: string; // format ISO: '2024-12-15'

  @Column()
  targetRole!: string; // 'professeur' ou 'admin'

  @Column({ default: false })
  notificationSent!: boolean;

  @UpdateDateColumn()
  updatedAt?: Date;
}