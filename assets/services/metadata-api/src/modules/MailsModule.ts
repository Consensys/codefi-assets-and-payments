import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailsService } from 'src/services/MailsService';

import { MailsController } from 'src/controllers/MailsController';
import { Mail, MailVariables } from 'src/model/MailEntity';
import { ConfigsModule } from './ConfigsModule';

@Module({
  imports: [TypeOrmModule.forFeature([Mail, MailVariables]), ConfigsModule],
  controllers: [MailsController],
  providers: [MailsService],
  exports: [MailsService],
})
export class MailsModule {}
