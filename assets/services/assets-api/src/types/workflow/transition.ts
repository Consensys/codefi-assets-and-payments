export enum keys {
  // following keys used in workflow instance / template types
  ID = 'id',
  TENANT_ID = 'tenantId',
  NAME = 'name',
  USER_ID = 'userId',
  WORKFLOW_INSTANCE_ID = 'workflowInstanceId',
  FROM_STATE = 'fromState',
  TO_STATE = 'toState',
  ROLE = 'role',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export interface TransitionTemplate {
  [keys.NAME]: string;
  [keys.FROM_STATE]: string;
  [keys.TO_STATE]: string;
  [keys.ROLE]: string;
}

export interface TransitionInstance {
  [keys.ID]: number;
  [keys.TENANT_ID]: string;
  [keys.NAME]: string;
  [keys.USER_ID]: string;
  [keys.WORKFLOW_INSTANCE_ID]: number;
  [keys.FROM_STATE]: string;
  [keys.TO_STATE]: string;
  [keys.ROLE]: string;
  [keys.CREATED_AT]: Date;
  [keys.UPDATED_AT]: Date;
}
