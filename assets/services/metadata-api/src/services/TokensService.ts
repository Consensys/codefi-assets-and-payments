import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import {
  TokenDto,
  FetchTokenQuery,
  FetchTokensQuery,
} from 'src/model/dto/TokensDto';
import { Token } from 'src/model/TokenEntity';
import { prettify, removeEmpty } from 'src/utils/common';
import { requireTenantId, checkTenantId } from 'src/utils/tenant';
import { AssetInstancesService } from './AssetInstancesService';

type TokenWithAssetData = Token & { assetData?: any };
@Injectable()
export class TokensService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(Token)
    private tokensRepository: Repository<Token>,
    private assetInstanceService: AssetInstancesService,
  ) {}

  private getTokensWithAssetData(
    tokens: Array<Token>,
    tenantId: string | undefined,
  ): Promise<Array<TokenWithAssetData>> {
    return Promise.all(
      tokens.map(async (tok) => ({
        ...tok,
        assetData: await this.assetInstanceService
          .craftAssetData(tenantId, tok, tok.assetTemplateId, tok.issuerId)
          .catch(() => {
            this.logger.error(
              `Failed to craft asset data to token: ${tok.id} and asset template ${tok.assetTemplateId}`,
            );
            return null;
          }),
      })),
    );
  }

  async create({
    tenantId,
    name,
    symbol,
    standard,
    workflowIds,
    defaultDeployment,
    defaultChainId,
    defaultNetworkKey,
    deployments,
    picture,
    assetTemplateId,
    assetInstanceId,
    description,
    bankAccount,
    assetClasses,
    issuerId,
    reviewerId,
    creatorId,
    data,
  }: TokenDto): Promise<Token | undefined> {
    requireTenantId(tenantId);

    // Check if inputs are valid
    await this.checkValidInputs(
      tenantId,
      undefined,
      defaultDeployment,
      defaultChainId,
      defaultNetworkKey,
    );

    const craftedTokenObject = {
      id: uuidv4(),
      tenantId,
      defaultDeployment,
      name,
      symbol,
      standard,
      workflowIds,
      defaultChainId,
      defaultNetworkKey,
      issuerId,
      creatorId,
      reviewerId,
      assetTemplateId,
      assetInstanceId,
      deployments,
      picture,
      description,
      bankAccount,
      assetClasses,
      data,
    };

    return this.tokensRepository.save(craftedTokenObject);
  }

  findOne(tenantId: string, id: string): Promise<Token | null> {
    requireTenantId(tenantId);

    return this.tokensRepository.findOne({
      where: { tenantId: tenantId, id: id },
    });
  }

  private async getAllTokensByTenantId(
    tenantId: string,
    offset?: number,
    limit?: number,
    withAssetData?: boolean,
  ): Promise<[Array<TokenWithAssetData>, number]> {
    const [tokens, total] = await this.tokensRepository.findAndCount({
      where: [{ tenantId }],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    if (!withAssetData) {
      return [tokens, total];
    }

    const tokensWithAssetData = await this.getTokensWithAssetData(
      tokens,
      tenantId,
    );
    return [tokensWithAssetData, total];
  }

  async find({
    tenantId,
    tokenId: id,
    defaultDeployment,
    defaultChainId = null,
    defaultNetworkKey = null,
    name,
    symbol,
    offset,
    limit,
    withAssetData,
  }: FetchTokenQuery): Promise<[Array<TokenWithAssetData>, number]> {
    requireTenantId(tenantId);

    if (!id && !defaultDeployment && !name && !symbol && tenantId) {
      return this.getAllTokensByTenantId(
        tenantId,
        offset,
        limit,
        withAssetData,
      );
    }

    const whereClauseConditions: any = [
      { tenantId, id },
      { tenantId, defaultDeployment, defaultChainId },
      { tenantId, name },
      { tenantId, symbol },
    ];

    if (defaultNetworkKey) {
      whereClauseConditions.push({
        tenantId,
        defaultDeployment,
        defaultNetworkKey,
      });
    }

    const [tokens, total] = await this.tokensRepository.findAndCount({
      where: whereClauseConditions,
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    if (!withAssetData) {
      return [tokens, total];
    }

    const tokensWithAssetData = await this.getTokensWithAssetData(
      tokens,
      tenantId,
    );
    return [tokensWithAssetData, total];
  }

  async search({
    tenantId,
    name,
    offset,
    limit,
    withAssetData,
  }: FetchTokenQuery): Promise<[Array<TokenWithAssetData>, number]> {
    requireTenantId(tenantId);

    const whereClauseConditions: any = [{ tenantId, name: Like(`${name}%`) }];

    const [tokens, total] = await this.tokensRepository.findAndCount({
      where: whereClauseConditions,
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    if (!withAssetData) {
      return [tokens, total];
    }

    const tokensWithAssetData = await this.getTokensWithAssetData(
      tokens,
      tenantId,
    );
    return [tokensWithAssetData, total];
  }

  async findBatch({
    tenantId,
    tokenIds,
    withAssetData,
  }: FetchTokensQuery): Promise<Array<TokenWithAssetData>> {
    requireTenantId(tenantId);

    if (tokenIds?.length > 0) {
      const tokens = await this.tokensRepository.find({
        where: [{ tenantId, id: In(tokenIds) }],
        order: { createdAt: 'DESC' },
      });

      if (!withAssetData) {
        return tokens;
      }

      return this.getTokensWithAssetData(tokens, tenantId);
    } else {
      return [];
    }
  }

  async update(
    tokenId: string,
    {
      tenantId,
      name,
      symbol,
      standard,
      workflowIds,
      defaultDeployment,
      defaultChainId,
      defaultNetworkKey,
      deployments,
      picture,
      description,
      assetTemplateId,
      assetInstanceId,
      bankAccount,
      assetClasses,
      issuerId,
      reviewerId,
      creatorId,
      data,
    }: TokenDto,
  ): Promise<Token> {
    requireTenantId(tenantId);

    // Find the token
    const targetedToken = await this.tokensRepository.findOne({
      where: { id: tokenId },
    });
    if (targetedToken) {
      this.logger.info(targetedToken);

      // Test if token belongs to the expected tenant
      checkTenantId(tenantId, targetedToken.tenantId);
      // Check if inputs are valid
      await this.checkValidInputs(
        tenantId,
        tokenId,
        defaultDeployment,
        defaultChainId,
        defaultNetworkKey,
      );

      const updatedToken: Token = await this.tokensRepository.save(
        {
          ...targetedToken,
          ...removeEmpty({
            name,
            symbol,
            standard,
            workflowIds,
            defaultDeployment,
            defaultChainId,
            defaultNetworkKey,
            deployments,
            assetTemplateId,
            assetInstanceId,
            issuerId,
            reviewerId,
            creatorId,
            picture,
            description,
            bankAccount,
            assetClasses,
            data,
          }),
        },
        { reload: true },
      );

      const tokensWithAssetData = {
        ...updatedToken,
        assetData: await this.assetInstanceService.craftAssetData(
          tenantId,
          updatedToken,
          updatedToken.assetTemplateId,
          updatedToken.issuerId,
        ),
      };

      this.logger.info(`Updated token: ${prettify(tokensWithAssetData)}`);
      return tokensWithAssetData;
    } else {
      const error = `Unable to find the token with id=${tokenId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(
    tenantId: string,
    tokenId: string,
  ): Promise<{ message: string }> {
    requireTenantId(tenantId);

    // Find the token
    const targetedToken = await this.tokensRepository.findOne({
      where: { id: tokenId },
    });

    // Test if token belongs to the expected tenant
    if (targetedToken) checkTenantId(tenantId, targetedToken.tenantId);

    const { affected } = await this.tokensRepository.delete(tokenId);
    if (affected && affected > 0) {
      const message = `${affected} deleted token(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the token with id=${tokenId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    requireTenantId(tenantId);

    const { affected } = await this.tokensRepository.delete({ tenantId });

    const message = `${affected} deleted token(s).`;
    this.logger.info(message);
    return { deletedTokensTotal: affected || 0 };
  }

  async checkValidInputs(
    tenantId,
    objectId,
    defaultDeployment,
    defaultChainId,
    defaultNetworkKey,
  ): Promise<boolean> {
    if (defaultDeployment) {
      const tokenWithSameDefaultDeployment: Array<Token> = (
        await this.find({
          tenantId,
          tokenIds: undefined,
          tokenId: undefined,
          defaultDeployment,
          defaultChainId,
          defaultNetworkKey,
          name: undefined,
          symbol: undefined,
        })
      )[0];

      let problem: boolean;
      if (objectId) {
        // If 'objectId', then it means it is an object update
        if (tokenWithSameDefaultDeployment.length > 1) {
          problem = true;
        } else if (tokenWithSameDefaultDeployment.length === 1) {
          if (tokenWithSameDefaultDeployment[0].id !== objectId) {
            problem = true;
          } else {
            problem = false;
          }
        } else {
          problem = false;
        }
      } else {
        // If not 'objectId', then it means it is an object creation
        if (tokenWithSameDefaultDeployment.length > 0) {
          problem = true;
        } else {
          problem = false;
        }
      }

      if (problem) {
        const error = `Invalid Token inputs: token with defaultDeployment address ${defaultDeployment} already exists for chain with ID ${defaultChainId}`;
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
}
