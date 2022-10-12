export const DEFAULT_TENANT_ID = 'codefi'
export const DEFAULT_INITIALIZATION_TENANT_ID = `'${process.env
  .DEFAULT_INITIALIZATION_TENANT_ID || DEFAULT_TENANT_ID}'`

export enum DATABASE_TABLES {
  TRANSACTION = 'transaction',
  TRANSITION_INSTANCE = 'transition_instance',
  WORKFLOW_INSTANCE = 'workflow_instance',
  WORKFLOW_TEMPLATE = 'workflow_template',
}
