import { Injectable } from "@nestjs/common";
import { DataFieldsOnly } from "../utils/types";
import { Item } from "../data/entities/ItemEntity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NestJSPinoLogger } from "@consensys/observability";

@Injectable()
export class ItemService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>
  ) {
    logger.setContext(ItemService.name);
  }

  async createItem(
    newItem: DataFieldsOnly<Item> & Pick<Item, "id">
  ): Promise<Item> {
    this.logger.info("Creating item", {
      item: newItem,
    });
    return this.itemRepository.save(newItem);
  }

  async updateItem(
    id: string,
    newItem: Omit<DataFieldsOnly<Item>, "tenantId">
  ): Promise<Item> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new Error("Item not found");
    }

    const updatedItem = {
      ...item,
      ...newItem,
    };

    this.logger.info("Updating item", {
      item: updatedItem,
    });

    return this.itemRepository.save(updatedItem);
  }

  async getItem(id: string, tenantId: string): Promise<Item | undefined> {
    const item = await this.itemRepository.findOne({ where: { id } });

    if (!item || item.tenantId !== tenantId) {
      return;
    }

    return item;
  }
}
