import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LegalEntityController } from '../controllers/LegalEntityController'
import { EthereumAddressEntity } from '../data/entities/EthereumAddressEntity'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'
import { TenantEntity } from '../data/entities/TenantEntity'
import { EthereumAddressService } from '../services/EthereumAddressService'
import { LegalEntityService } from '../services/LegalEntityService'
import { TenantService } from '../services/TenantService'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LegalEntityEntity,
      EthereumAddressEntity,
      TenantEntity,
    ]),
  ],
  controllers: [LegalEntityController],
  providers: [LegalEntityService, EthereumAddressService, TenantService],
  exports: [LegalEntityService, EthereumAddressService, TenantService],
})
export class LegalEntityModule {}
