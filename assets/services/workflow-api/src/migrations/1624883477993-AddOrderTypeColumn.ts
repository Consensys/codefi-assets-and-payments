import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrderSideColumn1624883477993 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TYPE IF EXISTS public.order_side_enum; 

        CREATE TYPE order_side_enum AS ENUM ('SELL', 'BUY');

        ALTER TABLE public.workflow_instance
        ADD COLUMN "orderSide" order_side_enum;

        UPDATE public.workflow_instance
        set "orderSide"='SELL' where "workflowType"='ORDER';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.workflow_instance
        DROP COLUMN IF EXISTS "orderSide" ;
        
        DROP TYPE IF EXISTS public.order_side_enum;
    `)
  }
}
