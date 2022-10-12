import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokensController } from 'src/controllers/TokensController';
import { TokensService } from 'src/services/TokensService';
import { Token } from 'src/model/TokenEntity';
import { AssetInstancesModule } from './AssetInstancesModule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    forwardRef(() => AssetInstancesModule),
    AssetInstancesModule,
  ],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
