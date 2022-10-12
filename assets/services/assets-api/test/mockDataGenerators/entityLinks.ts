import { EntityType } from 'src/types/entity';
import { UserType } from 'src/types/user';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { Link } from 'src/types/workflow/workflowInstances/link';

export const generateEntityLink = ({
  overrideEntityLink,
}: {
  overrideEntityLink?: Partial<Link>;
}) => {
  return {
    id: 383852,
    tenantId: 'fakeTenantId',
    brokerId: null,
    idempotencyKey: null,
    name: 'allowList',
    workflowType: WorkflowType.LINK,
    objectId: null,
    state: 'validated',
    role: UserType.ISSUER,
    workflowTemplateId: 133,
    transitionTemplates: undefined,
    userId: 'fakeUserId',
    recipientId: null,
    entityId: 'fakeTokenId',
    entityType: EntityType.TOKEN,
    wallet: '0x429a99A78323e7418Db19d27bbd81b3D86a2aF94',
    date: null,
    assetClassKey: 'shareclassname',
    quantity: 0,
    price: 0,
    documentId: null,
    paymentId: 'Bq3kPpyV',
    offerId: null,
    orderSide: null,
    data: {
      stateUpdatedTimestamps: {
        '1643979929595': 'invited',
        '1643979929730': 'validated',
      },
    },
    createdAt: new Date('2022-02-04T13:05:29.640Z'),
    updatedAt: new Date('2022-02-04T13:05:29.796Z'),
    ...(overrideEntityLink || {}),
  };
};
