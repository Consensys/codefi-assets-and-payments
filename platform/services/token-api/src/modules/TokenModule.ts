import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TokenEntity } from '../data/entities/TokenEntity'
import { TokensService } from '../services/TokensService'

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity])],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokenModule {}
