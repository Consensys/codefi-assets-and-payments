import { ApmModule } from '@codefi-assets-and-payments/observability';
import { Module } from '@nestjs/common';
import { CodefiConsumerService } from './CodefiConsumerService';

@Module({
  imports: [ApmModule],
  providers: [CodefiConsumerService],
  exports: [CodefiConsumerService],
})
export class CodefiConsumerModule {}
