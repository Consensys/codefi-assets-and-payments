import { Module } from '@nestjs/common';
import { M2mTokenService } from './M2mTokenService';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [M2mTokenService],
  exports: [M2mTokenService],
})
export class M2mTokenModule {}
