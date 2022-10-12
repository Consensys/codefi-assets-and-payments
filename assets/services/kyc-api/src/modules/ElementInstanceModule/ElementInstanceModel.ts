import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'elementInstances',
})
export class ElementInstanceModel extends Model<ElementInstanceModel> {
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
  elementKey: string;

  @Column({
    type: DataType.STRING,
  })
  userId: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  value: string[];

  @Column({
    type: DataType.JSON,
  })
  data: object;

  @CreatedAt
  @Column({ type: DataType.DATE })
  public createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  public updatedAt: Date;
}
