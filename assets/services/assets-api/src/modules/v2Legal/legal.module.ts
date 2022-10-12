import { Module } from '@nestjs/common';

import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  controllers: [LegalController],
  providers: [LegalService],
})
export class V2LegalModule {}
