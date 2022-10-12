import { MigrationInterface, QueryRunner } from 'typeorm'

const USER = process.env.POSTGRES_USER

export class CreateTransactionsTable1591070768360
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS public.transaction (
            id integer NOT NULL,
            "tenantId" character varying,
            status character varying NOT NULL,
            "signerId" character varying,
            "callerId" character varying,
            "identifierOrchestrateId" character varying,
            "identifierTxHash" character varying NOT NULL,
            "identifierCustom" character varying,
            callbacks text,
            context text NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
            PRIMARY KEY ("id")
        );
    `)
    await queryRunner.query(`
        ALTER TABLE public.transaction OWNER TO ${USER};
        CREATE SEQUENCE public.transaction_id_seq
            AS integer
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        ALTER TABLE public.transaction_id_seq OWNER TO ${USER};
        ALTER SEQUENCE public.transaction_id_seq OWNED BY public.transaction.id;
        ALTER TABLE ONLY public.transaction ALTER COLUMN id SET DEFAULT nextval('public.transaction_id_seq'::regclass);    
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE "transaction"')
  }
}
