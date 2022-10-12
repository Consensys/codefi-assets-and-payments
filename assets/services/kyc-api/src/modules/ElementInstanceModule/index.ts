import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ElementModule } from 'src/modules/ElementModule';
import { TemplateModule } from 'src/modules/TemplateModule';
import { ReviewModule } from 'src/modules/ReviewModule';
import { ExternalIdentityModule } from 'src/modules/ExternalIdentityModule';
import { MetadataModule } from 'src/modules/MetadataModule';

import { ElementInstanceController } from './ElementInstanceController';
import { ElementInstanceService } from './ElementInstanceService';
import { ElementInstanceModel } from './ElementInstanceModel';

@Module({
  imports: [
    SequelizeModule.forFeature([ElementInstanceModel]),
    ElementModule,
    TemplateModule,
    ReviewModule,
    ExternalIdentityModule,
    MetadataModule,
  ],
  providers: [ElementInstanceService],
  controllers: [ElementInstanceController],
  exports: [ElementInstanceService],
})
export class ElementInstanceModule {}
