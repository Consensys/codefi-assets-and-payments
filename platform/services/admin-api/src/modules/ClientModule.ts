import { Module } from '@nestjs/common'
import { Auth0Module } from './Auth0Module'
import { ClientController } from '../controllers/ClientController'
import { InfuraController } from '../controllers/InfuraController'
import { Auth0Service } from '../services/Auth0Service'
import { ClientService } from '../services/ClientService'
import { EventsModule } from './EventsModule'
import { ClientCreateCommandConsumer } from '../commands/ClientCreateCommandConsumer'

@Module({
  controllers: [ClientController, InfuraController],
  providers: [ClientService, Auth0Service, ClientCreateCommandConsumer],
  imports: [Auth0Module, EventsModule],
  exports: [ClientService],
})
export class ClientModule {}
