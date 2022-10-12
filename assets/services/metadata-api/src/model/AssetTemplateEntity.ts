import { Entity, Column } from 'typeorm';
import { AssetTemplateTopSection } from './dto/AssetTemplatesDto';
import { DATABASE_TABLES, AssetType, TokenCategory } from 'src/utils/constants';
import { Translation } from './common';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.ASSET_TEMPLATES)
export class AssetTemplate extends BaseEntity {
  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  title: Translation;

  @Column({
    type: 'enum',
    enum: TokenCategory,
    enumName: 'asset_templates_category_enum',
  })
  category: TokenCategory;

  @Column({
    type: 'enum',
    enum: AssetType,
    enumName: 'asset_templates_type_enum',
  })
  type: AssetType;

  @Column({
    type: 'json',
    nullable: false,
  })
  label: Translation;

  @Column({
    type: 'json',
    nullable: true,
  })
  description: Translation;

  @Column({
    type: 'simple-json',
    nullable: false,
  })
  topSections: Array<AssetTemplateTopSection>;

  @Column({
    type: 'json',
    nullable: true,
  })
  data: object;
}
