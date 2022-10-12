import { Module } from '@nestjs/common'
import { KeyController } from '../controllers/KeyController'
import { KeyService } from '../services/Key.service'

@Module({
  // imports: [TypeOrmModule.forFeature([Item])],
  controllers: [KeyController],
  providers: [KeyService],
})
export class KeysModule {}
