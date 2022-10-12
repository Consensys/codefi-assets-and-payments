import { Exclude } from 'class-transformer';
import {
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  id: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
  updatedAt: Date;
}
