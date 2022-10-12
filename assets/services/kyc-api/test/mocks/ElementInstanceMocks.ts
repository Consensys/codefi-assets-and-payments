import { v4 as uuidv4 } from 'uuid';
import { initialSeedElements } from 'src/db/init/index';
import { RequestElementInstance } from 'src/modules/ElementInstanceModule/RequestElementInstance';
import { ElementInstanceRequest } from 'src/modules/ElementInstanceModule/ElementInstanceRequest';

export const defaultElementInstance1: RequestElementInstance = {
  elementKey: initialSeedElements[0].key,
  userId: uuidv4(),
  value: ['test_value'],
  data: {},
};

export const defaultElementInstance2: RequestElementInstance = {
  elementKey: initialSeedElements[1].key,
  userId: uuidv4(),
  value: ['another test value'],
  data: {},
};

export const elementInstanceCreateRequestMock: ElementInstanceRequest = {
  elementInstances: [defaultElementInstance1],
  userInfo: {
    id: defaultElementInstance1.userId,
    email: 'fake@example.com',
  },
};
