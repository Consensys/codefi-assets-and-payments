import { MigrationInterface, QueryRunner } from 'typeorm'

const USER = process.env.POSTGRES_USER

export class CreateTransitionInstancesTable1591070789370
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS public.transition_instance (
            id integer NOT NULL,
            name character varying,
            "tenantId" character varying,
            "userId" character varying,
            "workflowInstanceId" integer NOT NULL,
            "fromState" character varying NOT NULL,
            "toState" character varying NOT NULL,
            role character varying NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
            PRIMARY KEY ("id")
        );
    `)
    await queryRunner.query(`
        ALTER TABLE public.transition_instance OWNER TO ${USER};
        CREATE SEQUENCE public.transition_instance_id_seq
            AS integer
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        ALTER TABLE public.transition_instance_id_seq OWNER TO ${USER};
        ALTER SEQUENCE public.transition_instance_id_seq OWNED BY public.transition_instance.id;
        ALTER TABLE ONLY public.transition_instance ALTER COLUMN id SET DEFAULT nextval('public.transition_instance_id_seq'::regclass);    
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE "transition_instance"')
  }
}
