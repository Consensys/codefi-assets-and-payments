import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm'

export abstract class EntityAutoFields {
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  @DeleteDateColumn({ type: 'timestamp' })
  deletedDate?: Date
}
