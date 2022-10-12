import { Entity, Column } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.ASSET_USECASES)
export class AssetUsecaseEntity extends BaseEntity {
  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  config: object;

  @Column({
    type: 'json',
    nullable: true,
  })
  keys: object;
}
