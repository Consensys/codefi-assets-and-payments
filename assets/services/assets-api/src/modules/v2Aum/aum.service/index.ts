import { Injectable } from '@nestjs/common';

import { keys as TokenKeys, Token } from 'src/types/token';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { NestJSPinoLogger } from '@consensys/observability';

import {
  getNavForShareClass,
  getTotalSupplyForShareClass,
} from 'src/utils/token';
import { TokenIdentifierEnum } from 'src/old/constants/enum';
import { ClassDataKeys } from 'src/types/asset';

@Injectable()
export class AumService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly tokenRetrievalService: TokenRetrievalService,
  ) {
    this.logger.setContext(TokenRetrievalService.name);
  }

  /**
   * [Retrieve total Aum of a subset of tokens - Only for ADMIN and SUPERADMIN roles.]
   */
  retrieveSlicedTotalAum = async (
    tenantId: string,
    callerId: string,
    offset: number,
    limit: number,
  ) => {
    // get sliced tokens
    const tokensResponse = await this.apiMetadataCallService.retrieveTokenInDB(
      tenantId,
      TokenIdentifierEnum.all,
      undefined, // tokenKey
      false, // shallReturnSingleToken
      offset,
      limit,
      false,
    );

    const slicedFullTokens = [];
    await Promise.all(
      tokensResponse.tokens.map(async (token) => {
        const fullToken = await this.tokenRetrievalService.retrieveFullToken(
          tenantId,
          callerId,
          token,
          undefined,
          true,
          true,
          false,
          undefined,
          false,
          false,
          false,
          false,
          false,
        );
        slicedFullTokens.push(fullToken);
      }),
    );

    let totalAum = 0;
    slicedFullTokens.map((token: Token) => {
      let aumToken = 0;
      const assetClasses = token[TokenKeys.ASSET_CLASSES].map((assetClass) => {
        const totalSupplyAssetClass = getTotalSupplyForShareClass(
          token,
          assetClass,
        );
        const navAssetClass = getNavForShareClass(token, assetClass);
        const aumAssetClass = totalSupplyAssetClass * navAssetClass;
        aumToken += aumAssetClass;
        return {
          [TokenKeys.NAME]: assetClass,
          [TokenKeys.TOTAL_SUPPLY]: totalSupplyAssetClass,
          [ClassDataKeys.NAV__VALUE]: navAssetClass,
          [TokenKeys.AUM]: aumAssetClass,
        };
      });
      totalAum += aumToken;
      return {
        [TokenKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [TokenKeys.ASSET_CLASSES]: assetClasses,
        [TokenKeys.TOTAL_SUPPLY]: token[TokenKeys.TOTAL_SUPPLY],
        [TokenKeys.AUM]: aumToken,
      };
    });

    const output = {
      aum: totalAum,
      count: tokensResponse.tokens.length,
      total: tokensResponse.total,
    };

    return output;
  };
}
