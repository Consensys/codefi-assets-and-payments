import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { TestingModule } from '@nestjs/testing';
import { Token } from '../../src/model/TokenEntity';
import { AssetTemplate } from '../../src/model/AssetTemplateEntity';
import { Repository } from 'typeorm';
import { getServer } from 'tests/testServer';

describe('Token routes', () => {
  // We need this timeout to allow typeorm migrations to run when createNestApplication
  jest.setTimeout(20000);

  let tokenRepository: Repository<Token>;
  let assetTemplateRepository: Repository<AssetTemplate>;

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const tenantId = 'fakeTenantId';
  let assetTemplateId: string;
  const defaultUrl = '/tokens';

  const defaultToken = {
    id: uuidv4(),
    tenantId,
    issuerId: '346f4745-dd55-43e5-9a45-80af9c4a574b',
    name: 'Test token',
    creatorId: '346f4745-dd55-43e5-9a45-80af9c4a574b',
    reviewerId: null,
    symbol: 'CODEFI',
    standard: 'ERC1400HoldableCertificateToken',
    workflowIds: null,
    defaultDeployment: null,
    defaultChainId: '10',
    defaultNetworkKey: null,
    deployments: [],
    description: null,
    picture: null,
    bankAccount: null,
    assetClasses: ['classic'],
    behaviours: null,
    data: {
      assetCreationFlow: 'SINGLE_PARTY',
      kycTemplateId: '93dcf3a2-0884-4a20-b687-04cdc7f3c48d',
      certificateActivated: true,
      certificateTypeAsNumber: 2,
      unregulatedERC20transfersActivated: false,
      worflowInstanceId: 192515,
      stateUpdatedTimestamps: {
        '1649179870301': 'initialized',
      },
      worflowInstanceState: 'initialized',
    },
  };

  const assetData = {
    type: 'CLOSED_END_FUND',
    category: 'HYBRID',
  };

  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
  });

  beforeAll(async () => {
    assetTemplateRepository = moduleRef.get('AssetTemplateRepository');
    const closeEndFundTemplate = await assetTemplateRepository.findOne({
      where: {
        name: 'CLOSED END FUND',
      },
    });

    if (!closeEndFundTemplate) {
      throw new Error('SOMETHING IS WRONG WITH THE TESTS');
    }
    assetTemplateId = closeEndFundTemplate.id;

    tokenRepository = moduleRef.get('TokenRepository');
  });

  afterAll(async () => {
    await tokenRepository.delete({});
  });

  describe('POST /tokens', () => {
    it('create token', async () => {
      const { id, ...token } = defaultToken;
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...token, assetTemplateId })
        .expect(201);
      expect(body).toEqual(
        expect.objectContaining({ ...token, assetTemplateId }),
      );
      await tokenRepository.delete({});
    });
  });

  describe('PUT /tokens', () => {
    const tokenId = uuidv4();
    beforeAll(async () => {
      await tokenRepository.save({
        ...defaultToken,
        id: tokenId,
        assetTemplateId,
      });
    });
    afterAll(async () => {
      await tokenRepository.delete({});
    });
    it('update token', async () => {
      const { body } = await app
        .put(`${defaultUrl}/${tokenId}?tenantId=${tenantId}`)
        .send({ ...defaultToken, name: 'update token' })
        .expect(200);
      expect(body).toEqual(
        expect.objectContaining({
          ...defaultToken,
          id: tokenId,
          name: 'update token',
          assetTemplateId,
        }),
      );
    });

    it('update token with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .put(`${defaultUrl}/${wrongId}?tenantId=${tenantId}`)
        .send({ ...defaultToken, name: 'update token' })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Unable to find the token with id=${wrongId}`,
      });
    });
  });

  describe('DELETE /tokens', () => {
    const tokenId = uuidv4();
    beforeAll(async () => {
      await tokenRepository.save({
        ...defaultToken,
        id: tokenId,
        assetTemplateId,
      });
    });

    it('delete token', async () => {
      const { body } = await app
        .delete(`${defaultUrl}/${tokenId}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toEqual({ message: '1 deleted token(s).' });
    });

    it('delete token with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}/${wrongId}?tenantId=${tenantId}`)
        .expect(404);
      expect(body).toEqual({
        status: 404,
        error: `Unable to find the token with id=${wrongId}`,
      });
    });
  });

  describe('GET /tokens', () => {
    beforeAll(async () => {
      await tokenRepository.save({
        ...defaultToken,
        assetTemplateId,
      });
    });
    afterAll(async () => {
      await tokenRepository.delete({});
    });
    it('returns list of tokens', async () => {
      const resp = await app.get(`/tokens?tenantId=${tenantId}`).expect(200);
      const [tokens, total] = resp.body;

      expect(total).toBe(1);
      expect(tokens[0]).toEqual({ ...defaultToken, assetTemplateId });
    });

    describe('with asset data', () => {
      it('returns list of tokens', async () => {
        const resp = await app
          .get(`/tokens?tenantId=${tenantId}&withAssetData=true`)
          .expect(200);

        const [tokens, total] = resp.body;

        expect(total).toBe(1);
        expect(tokens[0]).toEqual(
          expect.objectContaining({
            ...defaultToken,
            assetTemplateId,
            assetData,
          }),
        );
      });

      it('returns list of tokens with asset data as null when templateId does not exist', async () => {
        const assetTemplateId = uuidv4();
        const tokenWithoutAssetDataId = uuidv4();

        const { createdAt, updatedAt, ...tokenWithoutAssetData } =
          await tokenRepository.save({
            ...defaultToken,
            id: tokenWithoutAssetDataId,
            assetTemplateId,
          });

        const resp = await app
          .get(
            `/tokens?tenantId=${tenantId}&withAssetData=true&tokenIds=${JSON.stringify(
              [tokenWithoutAssetData.id],
            )}`,
          )
          .expect(200);

        expect(resp.body[0]).toEqual(
          expect.objectContaining({
            ...tokenWithoutAssetData,
            assetTemplateId,
            assetData: null,
          }),
        );

        await tokenRepository.delete({ id: tokenWithoutAssetData.id });
      });
    });

    describe('with token ids filter', () => {
      it('returns list of tokens', async () => {
        const tokenId = defaultToken.id;
        const resp = await app
          .get(
            `/tokens?tenantId=${tenantId}&tokenIds=${JSON.stringify([
              tokenId,
            ])}&withAssetData=true`,
          )
          .expect(200);

        expect(resp.body[0]).toEqual(
          expect.objectContaining({
            ...defaultToken,
            assetTemplateId,
            assetData,
          }),
        );
      });

      it('returns an empty list of tokens when filter by unexisting token ids', async () => {
        const resp = await app
          .get(
            `/tokens?tenantId=${tenantId}&tokenIds=${JSON.stringify([
              uuidv4(),
            ])}&withAssetData=true`,
          )
          .expect(200);

        expect(resp.body).toEqual([]);
      });
    });
  });
});
