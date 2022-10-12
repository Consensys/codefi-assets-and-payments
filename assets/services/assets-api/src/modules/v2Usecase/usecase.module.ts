import { Module } from '@nestjs/common';

// Controller
import { UserController } from './usecase.controller';
// Providers
import { UsecaseService } from './usecase.service';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
@Module({
  controllers: [UserController],
  providers: [UsecaseService],
  imports: [V2ApiCallModule],
  exports: [UsecaseService],
})
export class V2UsecaseModule {}
