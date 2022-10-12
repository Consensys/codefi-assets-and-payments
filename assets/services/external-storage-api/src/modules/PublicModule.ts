import { Module } from "@nestjs/common";
import { PublicController } from "../controllers/PublicController";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Item } from "../data/entities/ItemEntity";
import { ItemService } from "../services/ItemService";
import { S3Service } from "../services/S3Service";

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [PublicController],
  providers: [ItemService, S3Service],
})
export class PublicModule {}
