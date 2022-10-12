import { Module } from '@nestjs/common'
import { ChainRegistry } from './ChainRegistry'

@Module({
  providers: [ChainRegistry],
  exports: [ChainRegistry],
})
export class ChainRegistryModule {}
