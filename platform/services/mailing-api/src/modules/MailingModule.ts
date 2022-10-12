import { Module } from '@nestjs/common'
import { MailingController } from '../controllers/MailingController'
import { MailingService } from '../services/MailingService'
import { MailjetService } from '../services/MailjetService'

@Module({
  imports: [],
  controllers: [MailingController],
  providers: [MailingService, MailjetService],
})
export class MailingModule {}
