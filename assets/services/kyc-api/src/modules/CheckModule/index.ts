import { Module } from '@nestjs/common';

import { TemplateModule } from 'src/modules/TemplateModule';
import { ElementInstanceModule } from 'src/modules/ElementInstanceModule';
import { ElementModule } from 'src/modules/ElementModule';

import { CheckController } from './CheckController';
import { CheckService } from './CheckService';
import { ReviewModule } from '../ReviewModule';

@Module({
  imports: [TemplateModule, ElementInstanceModule, ElementModule, ReviewModule],
  providers: [CheckService],
  controllers: [CheckController],
  exports: [],
})
export class CheckModule {}
