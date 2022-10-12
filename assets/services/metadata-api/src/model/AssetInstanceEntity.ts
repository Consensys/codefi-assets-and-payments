import { Entity, Column } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';
import { AssetInstanceElementInstance } from './dto/AssetInstancesDto';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.ASSET_INSTANCES)
export class AssetInstance extends BaseEntity {
  @Column({
    nullable: false,
    type: 'uuid',
  })
  tokenId: string;

  @Column({
    nullable: false,
  })
  issuerId: string;

  @Column({
    nullable: false,
  })
  templateId: string;

  @Column({
    type: 'simple-json',
    nullable: false,
  })
  elementInstances: Array<AssetInstanceElementInstance>;

  @Column({
    type: 'json',
  })
  data: object;
}
