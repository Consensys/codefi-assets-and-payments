import { Module } from '@nestjs/common'
import { ApmService } from './ApmService'

// This module requires ApmClientModule to be initialised globally
@Module({
  imports: [],
  providers: [ApmService],
  exports: [ApmService],
})
export class ApmModule {}
