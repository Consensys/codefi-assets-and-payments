import { Module } from "@nestjs/common";
import { IpfsController } from "../controllers/IpfsController";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Item } from "../data/entities/ItemEntity";
import { ItemService } from "../services/ItemService";
import { IpfsService } from "../services/IpfsService";

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [IpfsController],
  providers: [ItemService, IpfsService],
})
export class IpfsModule {}
