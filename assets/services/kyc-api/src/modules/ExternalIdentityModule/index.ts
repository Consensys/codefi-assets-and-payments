import { Module } from '@nestjs/common';

import { ApiExternalIdentityService } from './ExternalIdentityService';
import { AxiosInstance } from '../../services/instances/AxiosInstance';

@Module({
  imports: [],
  providers: [ApiExternalIdentityService, AxiosInstance],
  exports: [ApiExternalIdentityService],
})
export class ExternalIdentityModule {}
