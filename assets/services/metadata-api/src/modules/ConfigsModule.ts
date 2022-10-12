import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsService } from 'src/services/ConfigsService';

import { ConfigsController } from 'src/controllers/ConfigsController';
import { Configs } from 'src/model/ConfigEntity';

@Module({
  imports: [TypeOrmModule.forFeature([Configs])],
  controllers: [ConfigsController],
  providers: [ConfigsService],
  exports: [ConfigsService],
})
export class ConfigsModule {}
