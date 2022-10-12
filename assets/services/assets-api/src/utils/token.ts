import { ClassDataKeys, ClassData, AssetDataKeys } from 'src/types/asset';
import { Token, keys as TokenKeys } from 'src/types/token';

export const getNavForShareClass = (
  token: Token,
  shareClass: string,
): number => {
  const assetData = token[TokenKeys.ASSET_DATA];
  const classData = assetData[AssetDataKeys.CLASS];
  const assetClass = classData.find(
    (data) => data[ClassDataKeys.KEY] === shareClass,
  );
  const navCurrentValue = (((assetClass as ClassData) || {})[
    ClassDataKeys.NAV
  ] || {})[ClassDataKeys.NAV__VALUE];
  const nav = navCurrentValue ? navCurrentValue : 0;
  return nav;
};

export const getTotalSupplyForShareClass = (
  token: Token,
  shareClass: string,
): number => {
  const assetClass = (token[TokenKeys.ASSET_CLASSES_ON_CHAIN] || []).find(
    (data) => data[TokenKeys.NAME] === shareClass,
  );
  const totalSupply = assetClass ? assetClass[TokenKeys.TOTAL_SUPPLY] : 0;
  return totalSupply;
};
