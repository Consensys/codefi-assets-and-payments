import { Module } from '@nestjs/common';

// Controller
import { TokenNonfungibleController } from './token.nonfungible.controller';

// Providers
import { TokenNonfungibleHelperService } from './token.nonfungible.service';

// Imported modules
import { V2UserModule } from 'src/modules/v2User/user.module';
import { V2TokenModule } from 'src/modules/v2Token/token.module';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [TokenNonfungibleController],
  providers: [TokenNonfungibleHelperService],
  imports: [V2UserModule, V2TokenModule, V2TransactionModule, V2ApiCallModule],
})
export class V2TokenNonfungibleModule {}
