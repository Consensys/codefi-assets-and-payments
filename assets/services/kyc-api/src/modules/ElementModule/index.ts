import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ElementController } from './ElementController';
import { ElementService } from './ElementService';
import { ElementModel } from './ElementModel';

@Module({
  imports: [SequelizeModule.forFeature([ElementModel])],
  providers: [ElementService],
  controllers: [ElementController],
  exports: [ElementService],
})
export class ElementModule {}
