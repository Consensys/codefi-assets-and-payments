import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class AddAgentIdKeyColumn1660719230068 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
          'workflow_instance',
          new TableColumn({
            name: 'agentId',
            type: 'varchar',
            isNullable: true,
          }),
        )
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('workflow_instance', 'agentId')
      }

}
