import { Module } from '@nestjs/common';

// Controller
import { TokenHybridController } from './token.hybrid.controller';

// Providers
import { TokenHybridHelperService } from './token.hybrid.service';

// Imported modules
import { V2UserModule } from 'src/modules/v2User/user.module';
import { V2TokenModule } from 'src/modules/v2Token/token.module';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [TokenHybridController],
  providers: [TokenHybridHelperService],
  imports: [V2TokenModule, V2TransactionModule, V2UserModule, V2ApiCallModule],
})
export class V2TokenHybridModule {}
