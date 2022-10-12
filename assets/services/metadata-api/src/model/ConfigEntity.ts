import { Entity, Column } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.CONFIGS)
export class Configs extends BaseEntity {
  @Column({
    unique: false,
    nullable: true,
  })
  userId: string;

  @Column({
    unique: false,
    nullable: true,
  })
  name: string;

  @Column({
    unique: false,
    nullable: true,
  })
  logo: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mailLogo: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mailColor: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mainColor: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mainColorLight: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mainColorLighter: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mainColorDark: string;

  @Column({
    unique: false,
    nullable: true,
  })
  mainColorDarker: string;

  @Column({
    unique: false,
    nullable: true,
  })
  language: string;

  @Column({
    unique: false,
    nullable: true,
  })
  region: string;

  @Column({
    nullable: false,
    type: 'text',
    array: true,
  })
  restrictedUserTypes: string[];

  @Column({
    nullable: false,
    type: 'text',
    array: true,
  })
  restrictedAssetTypes: string[];

  @Column({
    type: 'json',
    nullable: true,
  })
  data: any;

  @Column({
    type: 'json',
    nullable: true,
  })
  preferences: object;
}
