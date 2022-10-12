import { Module } from '@nestjs/common'
import { UserCreateCommandConsumer } from '../commands/UserCreateCommandConsumer'
import { UserController } from '../controllers/UserController'
import { UserService } from '../services/UserService'
import { Auth0Module } from './Auth0Module'
import { EventsModule } from './EventsModule'

@Module({
  imports: [Auth0Module, EventsModule],
  controllers: [UserController],
  providers: [UserService, UserCreateCommandConsumer],
})
export class UserModule {}
