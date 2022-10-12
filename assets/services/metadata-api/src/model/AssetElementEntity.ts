import { Entity, Column } from 'typeorm';
import {
  DATABASE_TABLES,
  AssetElementType,
  AssetElementStatus,
  AssetElementFileType,
} from 'src/utils/constants';
import { Translation } from './common';
import { AssetElementInput } from './dto/AssetElementsDto';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.ASSET_ELEMENTS)
export class AssetElement extends BaseEntity {
  @Column({
    unique: true,
    nullable: false,
  })
  key: string;

  @Column({
    unique: false,
    nullable: false,
  })
  map: string;

  @Column({
    unique: false,
    nullable: false,
  })
  updatable: boolean;

  @Column({
    type: 'enum',
    enum: AssetElementType,
    enumName: 'enum_asset_elements_type',
    nullable: false,
  })
  type: AssetElementType;

  @Column({
    type: 'enum',
    enum: AssetElementStatus,
    enumName: 'enum_asset_elements_status',
    nullable: false,
  })
  status: AssetElementStatus;

  @Column({
    type: 'json',
    nullable: false,
  })
  label: Translation;

  @Column({
    type: 'json',
    nullable: true,
  })
  sublabel: Translation;

  @Column({
    type: 'json',
    nullable: true,
  })
  placeholder: Translation;

  @Column({
    type: 'json',
    nullable: true,
  })
  rightTag: Translation;

  @Column({
    type: 'json',
    nullable: true,
  })
  leftTag: Translation;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  multiline: boolean;

  @Column({
    type: 'integer',
    nullable: true,
  })
  maxLength: number;

  @Column({
    type: 'integer',
    nullable: true,
  })
  size: 1 | 2 | 3 | 4 | 5;

  @Column({
    type: 'enum',
    enum: AssetElementFileType,
    enumName: 'enum_asset_elements_fileAccept',
    nullable: true,
  })
  fileAccept: AssetElementFileType;

  @Column({
    nullable: true,
  })
  name: string;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  fillLine: boolean;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  inputs: Array<AssetElementInput>;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  options: object;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  hidden: boolean;

  @Column({
    nullable: true,
  })
  defaultValue: string;
}
