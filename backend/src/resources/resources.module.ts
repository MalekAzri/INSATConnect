import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesResolver } from './resources.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ResourcesService, ResourcesResolver],
  exports: [ResourcesService],
})
export class ResourcesModule {}
