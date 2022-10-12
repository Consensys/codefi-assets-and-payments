import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from 'src/controllers/ProjectsController';
import { ProjectsService } from 'src/services/ProjectsService';
import { Project } from 'src/model/ProjectEntity';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
