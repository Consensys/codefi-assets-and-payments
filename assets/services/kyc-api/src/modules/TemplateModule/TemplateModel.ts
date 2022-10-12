import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { TopSection } from 'src/models/TopSection';

@Table({
  tableName: 'templates',
})
export class TemplateModel extends Model<TemplateModel> {
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
  issuerId: string;

  @Column({
    type: DataType.STRING,
  })
  name: string;

  @Column({
    type: DataType.ARRAY(DataType.JSON),
  })
  topSections: TopSection[];

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
