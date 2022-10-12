import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import { v4 as uuidv4 } from 'uuid';
import { AssetTemplate } from 'src/model/AssetTemplateEntity';
import { Token } from 'src/model/TokenEntity';
import { AssetInstancesDto } from 'src/model/dto/AssetInstancesDto';
import { AssetInstance } from 'src/model/AssetInstanceEntity';
import {
  templateDataResponse,
  elementInstances,
} from 'tests/mocks/AssetInstanceMocks';
import { mockToken } from 'tests/mocks/TokensMocks';

describe('Asset instance routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/assetInstances';
  const tenantId = 'fakeTenantId';
  let assetTemplateRepository: Repository<AssetTemplate>;
  let assetTemplateId: string;
  let tokenRepository: Repository<Token>;
  let assetInstanceRepository: Repository<AssetInstance>;
  const defaultToken = mockToken(tenantId, uuidv4());
  let assetInstance: AssetInstancesDto;

  beforeAll(async () => {
    const { superTestApp, moduleRef: module, nestApp: nApp } = getServer();
    moduleRef = module;
    app = superTestApp;
    assetTemplateRepository = moduleRef.get('AssetTemplateRepository');
    assetInstanceRepository = moduleRef.get('AssetInstanceRepository');
    const currencyTemplate = await assetTemplateRepository.findOne({
      where: {
        name: 'CURRENCY',
      },
    });
    if (!currencyTemplate) {
      throw new Error('SOMETHING IS WRONG WITH THE TESTS');
    }
    assetTemplateId = currencyTemplate.id;

    tokenRepository = moduleRef.get('TokenRepository');
    assetInstance = {
      tokenId: defaultToken.id,
      templateId: assetTemplateId,
      issuerId: uuidv4(),
      elementInstances,
      tenantId,
      data: {},
    };
    await tokenRepository.save({
      ...defaultToken,
      assetTemplateId,
    });
  });

  afterAll(async () => {
    await assetInstanceRepository.delete({});
    await tokenRepository.delete({});
  });

  describe('POST /assetInstances', () => {
    afterAll(async () => {
      await assetInstanceRepository.delete({});
    });
    it('create asset instance', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(assetInstance)
        .expect(201);
      expect(body).toEqual(expect.objectContaining(assetInstance));
    });
    it('update asset instance', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(assetInstance)
        .expect(201);
      expect(body).toEqual(expect.objectContaining(assetInstance));
    });
    it('create asset instance with wrong tokenId', async () => {
      const tokenId = uuidv4();
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...assetInstance, tokenId })
        .expect(400);
      expect(body.error).toEqual(`Unable to find token with id ${tokenId}`);
    });

    it('create asset instance with wrong templateId', async () => {
      const templateId = uuidv4();
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...assetInstance, templateId })
        .expect(400);
      expect(body.error).toEqual(
        `Unable to find the assetTemplate with id ${templateId}`,
      );
    });
    it('create asset instance with invalid element', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({
          ...assetInstance,
          elementInstances: [
            ...elementInstances,
            { key: 'test_element_key', value: [''] },
          ],
        })
        .expect(400);
      expect(body.error).toEqual(
        `Invalid element with key=test_element_key, not requested in the asset template`,
      );
    });

    it('valid asset data', async () => {
      const { body } = await app
        .post(`${defaultUrl}/validity/check?tenantId=${tenantId}`)
        .send({
          templateId: assetInstance.templateId,
          elementInstances,
        })
        .expect(201);
      expect(body).toEqual([true, 'Valid asset data']);
    });
  });

  describe('GET /assetInstances', () => {
    const instanceId = uuidv4();
    beforeAll(async () => {
      await assetInstanceRepository.save({
        ...assetInstance,
        id: instanceId,
      });
    });
    afterAll(async () => {
      await assetInstanceRepository.delete({});
    });
    it('Get instance by id', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${instanceId}`)
        .expect(200);
      expect(body).toHaveLength(1);
    });
    it('Get instance by tokenId templateId and issuerId', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&tokenId=${assetInstance.tokenId}&templateId=${assetInstance.templateId}&issuerId=${assetInstance.issuerId}`,
        )
        .expect(200);
      expect(body).toHaveLength(1);
    });
    it('Get all instances', async () => {
      const id = uuidv4();
      await assetInstanceRepository.save({
        ...assetInstance,
        id,
      });
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toHaveLength(2);
      await assetInstanceRepository.delete({ id });
    });
    it('Get by batch', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}/data?tenantId=${tenantId}&tokenIds=${JSON.stringify([
            assetInstance.tokenId,
          ])}&templateIds=${JSON.stringify([
            assetInstance.templateId,
          ])}&issuerIds=${JSON.stringify([assetInstance.issuerId])}`,
        )
        .expect(200);
      expect(body).toHaveLength(1);
    });
    it('Diferent params size', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}/data?tenantId=${tenantId}&tokenIds=${JSON.stringify([
            assetInstance.tokenId,
          ])}&templateIds=${JSON.stringify([
            assetInstance.templateId,
          ])}&issuerIds=${JSON.stringify([assetInstance.issuerId, 'test'])}`,
        )
        .expect(400);
      expect(body.error).toEqual(
        'Invalid input: tokensIds(1), templateIds(1) and issuerIds(2) shall have the same length',
      );
    });
    it('Get asset template data', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}/data?tenantId=${tenantId}&tokenId=${assetInstance.tokenId}&templateId=${assetInstance.templateId}&issuerId=${assetInstance.issuerId}`,
        )
        .expect(200);
      expect(body.topSections).toHaveLength(
        templateDataResponse.topSections.length,
      );
      expect(body.topSections[0].sections[0].elements).toHaveLength(
        templateDataResponse.topSections[0].sections[0].elements.length,
      );
    });
    it('Check asset data completion by templateId, tokenId & issuerId', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}/completion/check?tenantId=${tenantId}&tokenId=${assetInstance.tokenId}&templateId=${assetInstance.templateId}&issuerId=${assetInstance.issuerId}`,
        )
        .expect(200);
      expect(body).toEqual([
        true,
        'Successful asset data completion check: All requested asset elements have been submitted',
      ]);
    });
  });

  describe('DELETE /assetInstances', () => {
    it('delete asset instance', async () => {
      const instance = await assetInstanceRepository.save({
        ...assetInstance,
        id: uuidv4(),
      });

      const { body } = await app
        .delete(`${defaultUrl}/${instance.id}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toEqual({ message: '1 deleted elementInstance(s).' });
    });

    it('delete with wrong tenantId', async () => {
      const instance = await assetInstanceRepository.save({
        ...assetInstance,
        id: uuidv4(),
      });

      const { body } = await app
        .delete(`${defaultUrl}/${instance.id}?tenantId=wrongTenant`)
        .expect(400);
      expect(body.error).toEqual(
        `invalid tenantId (wrongTenant <> ${tenantId})`,
      );
    });

    it('delete instance with unexisting id', async () => {
      const id = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(404);
      expect(body.error).toEqual(
        `Unable to find the elementInstance with id=${id}`,
      );
    });
  });
});
