import { Module } from '@nestjs/common';

import { ApiMetadataService } from './MetadataService';
import { AxiosInstance } from '../../services/instances/AxiosInstance';

@Module({
  imports: [],
  providers: [ApiMetadataService, AxiosInstance],
  exports: [ApiMetadataService],
})
export class MetadataModule {}
