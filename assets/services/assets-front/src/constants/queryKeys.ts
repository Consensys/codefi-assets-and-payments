import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';

export const tokenKeys = {
  all: [{ scope: 'tokens' }] as const,
  actions: (
    offset: number,
    limit: number,
    states: string,
    functionNames: string,
    tokenIds: string,
    tokenId: string,
  ) => [
    {
      scope: 'actions',
      offset,
      limit,
      states,
      functionNames,
      tokenIds,
      tokenId,
    },
  ],
  token: (
    id: string,
    withBalances: boolean,
    withCycles: boolean,
    withAssetData: boolean,
  ) => [{ scope: 'token', id, withBalances, withAssetData, withCycles }],
  overview: (token: IToken) => [{ scope: 'tokenOverview', token }],
  investors: (id: string, limit: number, offset: number) => [
    { scope: 'investors', id, limit, offset },
  ],
  searchInvestors: (
    assetId: string,
    query: string,
    limit: number,
    offset: number,
  ) => [{ scope: 'searchInvestors', assetId, query, limit, offset }],
  primaryMarket: (
    token: IToken,
    limit: number,
    offset: number,
    filter: string,
  ) => [{ scope: 'primaryMarket', token, limit, offset, filter }],
  lifecycleEvents: (
    id: string,
    limit: number,
    offset: number,
    states: string,
    types: string,
  ) => [{ scope: 'lifecycleEvents', id, limit, offset, states, types }],
  funds: (
    offset: number,
    limit: number,
    withBalances: boolean,
    withCycles: boolean,
    withAssetData: boolean,
    withSearch = '',
  ) =>
    [
      {
        ...tokenKeys.all[0],
        offset,
        limit,
        withBalances,
        withCycles,
        withAssetData,
        withSearch,
      },
    ] as const,
  searchTokens: (name: string) => [
    {
      scope: 'searchTokens',
      name,
    },
  ],
};

export const orderKeys = {
  order: (id: string, withBalances: boolean) => [
    { scope: 'order', id, withBalances },
  ],
};

export const networkKeys = {
  all: [{ scope: 'networks' }] as const,
};

export const userKeys = {
  all: [{ scope: 'users' }] as const,
};
