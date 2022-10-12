import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ElementInstanceModule } from 'src/modules/ElementInstanceModule';

import { ReviewController } from './ReviewController';
import { ReviewService } from './ReviewService';
import { ReviewModel } from './ReviewModel';
import { TemplateModule } from '../TemplateModule';
import { ExternalIdentityModule } from '../ExternalIdentityModule';

@Module({
  imports: [
    SequelizeModule.forFeature([ReviewModel]),
    forwardRef(() => ElementInstanceModule),
    TemplateModule,
    ExternalIdentityModule,
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
