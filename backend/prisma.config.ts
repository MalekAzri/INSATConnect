import 'dotenv/config';
import * as path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    seed: 'ts-node --transpile-only ./prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db',
  },
});
