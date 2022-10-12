import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ElementModel } from 'src/modules/ElementModule/ElementModel';
import { ElementService } from 'src/modules/ElementModule/ElementService';

import { UtilsController } from './UtilsController';

import { TemplateService } from 'src/modules/TemplateModule/TemplateService';
import { TemplateModel } from 'src/modules/TemplateModule/TemplateModel';

import { ReviewService } from 'src/modules/ReviewModule/ReviewService';
import { ReviewModel } from 'src/modules/ReviewModule/ReviewModel';

import { ElementInstanceService } from 'src/modules/ElementInstanceModule/ElementInstanceService';
import { ElementInstanceModel } from 'src/modules/ElementInstanceModule/ElementInstanceModel';

import { ApiExternalIdentityService } from '../ExternalIdentityModule/ExternalIdentityService';
import { ApiMetadataService } from '../MetadataModule/MetadataService';
import { AxiosInstance } from 'src/services/instances/AxiosInstance';

@Module({
  imports: [
    SequelizeModule.forFeature([TemplateModel]),
    SequelizeModule.forFeature([ReviewModel]),
    SequelizeModule.forFeature([ElementInstanceModel]),
    SequelizeModule.forFeature([ElementModel]),
  ],
  providers: [
    TemplateService,
    ReviewService,
    ElementService,
    ElementInstanceService,
    ApiExternalIdentityService,
    ApiMetadataService,
    AxiosInstance,
  ],
  controllers: [UtilsController],
})
export class UtilsModule {}
