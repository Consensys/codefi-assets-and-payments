import { Entity, Column } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.PROJECTS)
export class Project extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  key: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  picture: Array<string>;

  @Column({
    type: 'json',
    nullable: true,
  })
  bankAccount: object;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  kycTemplateId: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  data: object;
}
