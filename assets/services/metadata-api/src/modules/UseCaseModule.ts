import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UseCaseController } from 'src/controllers/UseCaseController';
import { UseCaseService } from 'src/services/UseCaseService';
import { AssetUsecaseEntity } from '../model/AssetUsecaseEntity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetUsecaseEntity])],
  controllers: [UseCaseController],
  providers: [UseCaseService],
  exports: [UseCaseService],
})
export class UseCaseModule {}
