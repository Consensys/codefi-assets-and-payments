import { Module } from '@nestjs/common'
import { ContractRegistry } from './ContractRegistry'

@Module({
  providers: [ContractRegistry],
  exports: [ContractRegistry],
})
export class ContractRegistryModule {}
