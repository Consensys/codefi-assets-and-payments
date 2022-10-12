import { Module } from '@nestjs/common';

// Controller
import { TokenFungibleController } from './token.fungible.controller';

// Providers
import { TokenFungibleHelperService } from './token.fungible.service';

// Imported modules
import { V2UserModule } from 'src/modules/v2User/user.module';
import { V2TokenModule } from 'src/modules/v2Token/token.module';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [TokenFungibleController],
  providers: [TokenFungibleHelperService],
  imports: [V2UserModule, V2TokenModule, V2TransactionModule, V2ApiCallModule],
})
export class V2TokenFungibleModule {}
