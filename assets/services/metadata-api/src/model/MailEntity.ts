import {
  Entity,
  Column,
  Index,
  JoinColumn,
  PrimaryColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { DATABASE_TABLES } from 'src/utils/constants';

@Entity(DATABASE_TABLES.MAIL_VARIABLES)
export class MailVariables {
  @Column({
    nullable: false,
  })
  @PrimaryColumn()
  @Index('UX_mail_variables_key', { unique: true })
  @Exclude()
  key: string;

  @Column('text', {
    nullable: false,
    array: true,
  })
  variables: string[];
}

@Entity(DATABASE_TABLES.MAILS)
@Index('UX_mails_tenantId_key', ['tenantId', 'key'], { unique: true })
export class Mail {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  @Exclude()
  id: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  @Exclude()
  tenantId: string;

  @Exclude()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({
    nullable: false,
  })
  key: string;

  @Column({
    nullable: false,
  })
  subject: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  messageTitle: string;

  @Column({
    nullable: false,
    type: 'text',
  })
  message: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  buttonLabel: string;

  @ManyToOne(() => MailVariables, { nullable: false, eager: true })
  @JoinColumn({ referencedColumnName: 'key' })
  @Transform((value: any) => value.variables)
  variables: MailVariables;
}
