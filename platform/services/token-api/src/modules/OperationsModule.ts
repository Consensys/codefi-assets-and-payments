import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OperationsController } from '../controllers/OperationsController'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationsService } from '../services/OperationsService'

@Module({
  imports: [TypeOrmModule.forFeature([OperationEntity])],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
