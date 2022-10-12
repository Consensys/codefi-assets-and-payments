import { QueryRunner } from 'typeorm';

export const createEnumType = async (
  queryRunner: QueryRunner,
  typeName: string,
  values: string,
) => {
  await queryRunner.query(`
      DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
                CREATE TYPE ${typeName} AS ENUM (${values});
            END IF;
        END
      $$;
    `);
};
