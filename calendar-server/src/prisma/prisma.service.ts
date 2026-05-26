import 'dotenv/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL ?? 'file:./calendar.db',
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.ensureSchema();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async ensureSchema(): Promise<void> {
    await this.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "AcademicDate" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "key" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "targetRole" TEXT NOT NULL,
        "notificationSent" BOOLEAN NOT NULL DEFAULT false,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    await this.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "AcademicDate_key_key" ON "AcademicDate"("key")',
    );
  }
}
