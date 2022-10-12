import { MigrationInterface, QueryRunner } from 'typeorm'

const USER = process.env.POSTGRES_USER

export class CreateWorkflowTemplatesTable1591070808729
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS public.workflow_template (
            id integer NOT NULL,
            name character varying NOT NULL,
            "tenantIds" text NOT NULL,
            roles text NOT NULL,
            states text NOT NULL,
            "transitionTemplates" text NOT NULL,
            "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
            "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
            PRIMARY KEY ("id")
        );
    `)
    await queryRunner.query(`
        ALTER TABLE public.workflow_template OWNER TO ${USER};
        CREATE SEQUENCE public.workflow_template_id_seq
            AS integer
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        ALTER TABLE public.workflow_template_id_seq OWNER TO ${USER};
        ALTER SEQUENCE public.workflow_template_id_seq OWNED BY public.workflow_template.id;
        ALTER TABLE ONLY public.workflow_template ALTER COLUMN id SET DEFAULT nextval('public.workflow_template_id_seq'::regclass);    
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE "workflow_template"')
  }
}
