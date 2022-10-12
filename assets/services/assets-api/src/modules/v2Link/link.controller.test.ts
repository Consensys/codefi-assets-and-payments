import createMockInstance from 'jest-create-mock-instance';
import { EntityService } from '../v2Entity/entity.service';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';

describe('LinkController', () => {
  let controller: LinkController;
  let linkServiceMock: LinkService;
  let entityServiceMock: EntityService;
  beforeEach(() => {
    linkServiceMock = createMockInstance(LinkService);
    entityServiceMock = createMockInstance(EntityService);

    controller = new LinkController(linkServiceMock, entityServiceMock);
  });

  it('Nav', async () => {
    await expect(true).toBe(true);
  });
});
