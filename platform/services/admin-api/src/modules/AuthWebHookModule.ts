import { Module } from '@nestjs/common'
import { WebHookController } from '../controllers/WebHookController'
import { WebHookService } from '../services/WebHookService'
import { EventsModule } from './EventsModule'

@Module({
  imports: [EventsModule],
  controllers: [WebHookController],
  providers: [WebHookService],
})
export class AuthWebHookModule {}
