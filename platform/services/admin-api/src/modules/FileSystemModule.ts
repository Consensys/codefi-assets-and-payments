import { Module } from '@nestjs/common'
import { FileSystemInstance } from '../services/instances/FileSystemInstance'

@Module({
  providers: [FileSystemInstance],
  exports: [FileSystemInstance],
})
export class FileSystemModule {}
