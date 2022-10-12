import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ElementModule } from 'src/modules/ElementModule';

import { TemplateController } from './TemplateController';
import { TemplateService } from './TemplateService';
import { TemplateModel } from './TemplateModel';

@Module({
  imports: [SequelizeModule.forFeature([TemplateModel]), ElementModule],
  providers: [TemplateService],
  controllers: [TemplateController],
  exports: [TemplateService],
})
export class TemplateModule {}
