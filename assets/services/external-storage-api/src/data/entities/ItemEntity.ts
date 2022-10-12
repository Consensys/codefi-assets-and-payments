import { Entity, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity } from "./BaseEntity";

const ITEMS_TABLE_NAME = "Items";

@Entity(ITEMS_TABLE_NAME)
export class Item extends BaseEntity {
  @ApiProperty()
  @Column()
  content: string;

  @ApiProperty()
  @Column()
  contentType: string;

  @ApiProperty()
  @Column()
  tenantId: string;
}
