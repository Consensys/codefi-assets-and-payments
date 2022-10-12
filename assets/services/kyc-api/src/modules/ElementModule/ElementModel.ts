import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Translation } from 'src/models/Translation';
import { Input } from 'src/models/Input';
import { ElementType, ElementStatus } from 'src/utils/constants/enum';

@Table({
  tableName: 'elements',
})
export class ElementModel extends Model<ElementModel> {
  @Column({
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id: string;

  @Column({
    type: DataType.STRING,
  })
  tenantId: string;

  @Column({
    type: DataType.STRING,
  })
  key: string;

  @Column({
    type: DataType.ENUM(
      ElementType.STRING,
      ElementType.NUMBER,
      ElementType.CHECK,
      ElementType.RADIO,
      ElementType.DOCUMENT,
      ElementType.MULTISTRING,
      ElementType.DATE,
      ElementType.TITLE,
    ),
  })
  type: string;

  @Column({
    type: DataType.ENUM(
      ElementStatus.MANDATORY,
      ElementStatus.OPTIONAL,
      ElementStatus.CONDITIONAL,
    ),
  })
  status: string;

  @Column({
    type: DataType.JSON,
  })
  label: Translation;

  @Column({
    type: DataType.JSON,
  })
  placeholder: Translation;

  @Column({
    type: DataType.ARRAY(DataType.JSON),
  })
  inputs: Input[];

  @Column({
    type: DataType.JSON,
  })
  data: any;

  @CreatedAt
  @Column({ type: DataType.DATE })
  public createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  public updatedAt: Date;
}
