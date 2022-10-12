import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { TransitionInstancesController } from '../controllers/TransitionInstancesController'
import { TransitionInstancesService } from '../services/TransitionInstancesService'
import { TransitionInstance } from '../models/TransitionInstanceEntity'

@Module({
  imports: [TypeOrmModule.forFeature([TransitionInstance])],
  controllers: [TransitionInstancesController],
  providers: [TransitionInstancesService],
})
export class TransitionInstancesModule {}
