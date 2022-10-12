import { MigrationInterface, QueryRunner } from 'typeorm'

const USER = process.env.POSTGRES_USER

export class CreateWorkflowInstancesTable1591070824129
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS public.workflow_instance (
            id integer NOT NULL,
            name character varying,
            "tenantId" character varying,
            state character varying NOT NULL,
            role character varying NOT NULL,
            "workflowTemplateId" integer NOT NULL,
            "transitionTemplates" text NOT NULL,
            "userId" character varying NOT NULL,
            "recipientId" character varying,
            "tokenId" character varying,
            data text NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
            PRIMARY KEY ("id")
        );
    `)
    await queryRunner.query(`
        ALTER TABLE public.workflow_instance OWNER TO ${USER};
        CREATE SEQUENCE public.workflow_instance_id_seq
            AS integer
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        ALTER TABLE public.workflow_instance_id_seq OWNER TO ${USER};
        ALTER SEQUENCE public.workflow_instance_id_seq OWNED BY public.workflow_instance.id;
        ALTER TABLE ONLY public.workflow_instance ALTER COLUMN id SET DEFAULT nextval('public.workflow_instance_id_seq'::regclass);    
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE "workflow_instance"')
  }
}
