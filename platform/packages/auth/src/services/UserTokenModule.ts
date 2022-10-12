import { Module } from '@nestjs/common';
import { UserTokenService } from './UserTokenService';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [UserTokenService],
  exports: [UserTokenService],
})
export class UserTokenModule {}
