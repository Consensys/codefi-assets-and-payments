import { MigrationInterface, QueryRunner } from 'typeorm'

export class TransformDeprecatedVerifierNavManagerNotaryStates1630509059802
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE public.workflow_instance SET state = 'validated' where state in ('verifier','navManager','notary');",
    )
  }

  public async down(): Promise<void> {
    return null
  }
}
