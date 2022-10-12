import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OperationsController } from '../controllers/OperationsController'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationService } from '../services/OperationService'

@Module({
  imports: [TypeOrmModule.forFeature([OperationEntity])],
  providers: [OperationService],
  controllers: [OperationsController],
  exports: [OperationService],
})
export class OperationsModule {}
