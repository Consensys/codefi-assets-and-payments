import React, { useState, useEffect } from 'react';
import { mdiDelete } from '@mdi/js';
import clsx from 'clsx';
import { useSelector } from 'react-redux';

import Button from 'uiComponents/Button';
import Tooltip from 'uiComponents/Tooltip';
import { colors } from 'constants/styles';
import {
  CLIENT_ROUTE_ASSET_OVERVIEW,
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_ISSUER_ASSET_CREATION,
  CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER,
} from 'routesList';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import {
  IToken,
  AssetType,
  PrimaryTradeType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  constructCofidocsFileUrl,
  getNextTransactionStatus,
  computeAuM,
  getTokenCurrency,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { orderManagementRules } from 'utils/tokenUtility';

import StyledAssetCard from './StyledAssetCard';
import { IUser, UserType } from 'User';
import { hasRole } from 'utils/HasRole';
import { useIntl } from 'react-intl';
import { assetCardMessages } from 'texts/routes/issuer/assetManagement';
import { TxStatus } from 'Transaction';
import Address from 'uiComponents/Address';
import { UseMutateFunction } from '@tanstack/react-query';
import { userSelector } from 'features/user/user.store';

interface IProps {
  asset: IToken;
  compact?: boolean;
  removeToken?: UseMutateFunction<unknown, unknown, IToken, unknown>;
}

const AssetCard: React.FC<IProps> = ({
  asset,
  compact = false,
  removeToken,
}: IProps) => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;
  const assetData = asset.assetData;
  const assetGeneralData = assetData?.asset;
  const cover = assetGeneralData?.images?.cover as any;
  const [background, setBackground] = useState<string | null>(null);

  const assetType = asset.assetData?.type;
  const isCommodity = assetType === AssetType.PHYSICAL_ASSET;
  const isSyndicatedLoan = assetType === AssetType.SYNDICATED_LOAN;

  useEffect(() => {
    if (cover) {
      constructCofidocsFileUrl(cover.key).then((res) => setBackground(res));
    }
  }, [cover]);

  const getStatus = (status: string) => {
    switch (status) {
      case TxStatus.PENDING:
      case TxStatus.PROCESSING:
        return intl.formatMessage(assetCardMessages.pending);
      case TxStatus.VALIDATED:
        return intl.formatMessage(assetCardMessages.deployed);
      case TxStatus.REVERTED:
        return intl.formatMessage(assetCardMessages.deploymentFailed);
      case TxStatus.FAILED:
        return intl.formatMessage(assetCardMessages.deploymentFailed);
      default:
        return '';
    }
  };

  const getTooltip = (
    isTransactionRevertedOrFailed: boolean,
    isTransactionPendingOrProcessing: boolean,
    isDeprecated: boolean,
  ) => {
    switch (true) {
      case isTransactionRevertedOrFailed:
        return intl.formatMessage(assetIssuanceMessages.revertedAsset);
      case isTransactionPendingOrProcessing:
        return intl.formatMessage(assetIssuanceMessages.pendingAsset);
      case isDeprecated:
        return intl.formatMessage(assetIssuanceMessages.deprecatedAsset, {
          chainId: asset.defaultChainId,
        });

      default:
        return `${intl.formatMessage(
          assetIssuanceMessages.deployedAsset,
        )} ${intl.formatMessage(assetCardMessages.contractAddress, {
          address: asset.defaultDeployment,
        })}`;
    }
  };

  const nextTransactionStatus = getNextTransactionStatus(asset.data);
  const isTransactionPendingOrProcessing =
    nextTransactionStatus === TxStatus.PENDING ||
    nextTransactionStatus === TxStatus.PROCESSING;
  const isTransactionRevertedOrFailed =
    nextTransactionStatus === TxStatus.REVERTED ||
    nextTransactionStatus === TxStatus.FAILED;

  const isDeprecated = !!asset.data.deprecatedChainId;
  const isDraft =
    !asset.defaultDeployment &&
    !isTransactionRevertedOrFailed &&
    !isTransactionPendingOrProcessing;

  return (
    <StyledAssetCard>
      {!compact && (
        <header
          style={{
            backgroundImage: background ? `url(${background})` : '',
          }}
        />
      )}
      <div className="title">
        <div>{(assetGeneralData?.name || asset.name).slice(0, 25)}</div>
      </div>
      {isDraft && (
        <div className="draftInfos">
          <p>{intl.formatMessage(assetCardMessages.completeCreatingAsset)}</p>
          <Button
            label={intl.formatMessage(assetCardMessages.continueAssetCreation)}
            href={CLIENT_ROUTE_ISSUER_ASSET_CREATION.pathBuilder(asset.id)}
            size="small"
            disabled={!assetData}
          />
          <Button
            label={intl.formatMessage(assetCardMessages.removeAsset)}
            size="small"
            tertiary
            iconLeft={mdiDelete}
            color={colors.errorDark}
            onClick={() => removeToken && removeToken(asset)}
            disabled={!assetData}
          />
        </div>
      )}

      {!isDraft && (
        <div className="assetInfos">
          <ul>
            {asset.defaultDeployment && (
              <li>
                <span>{intl.formatMessage(assetCardMessages.address)}</span>
                <span>
                  <Address address={asset.defaultDeployment as string} />
                </span>
              </li>
            )}
            <li>
              <span>{intl.formatMessage(assetCardMessages.status)}</span>
              <span
                className={clsx({
                  pending:
                    !isTransactionRevertedOrFailed &&
                    isTransactionPendingOrProcessing &&
                    !isDeprecated,
                  deployed:
                    !isTransactionRevertedOrFailed &&
                    !isTransactionPendingOrProcessing &&
                    !isDeprecated,
                  reverted: isTransactionRevertedOrFailed && !isDeprecated,
                  deprecated: isDeprecated,
                })}
              >
                <Tooltip
                  title={getTooltip(
                    isTransactionRevertedOrFailed,
                    isTransactionPendingOrProcessing,
                    isDeprecated,
                  )}
                >
                  {isDeprecated
                    ? intl.formatMessage(assetCardMessages.deprecated)
                    : getStatus(nextTransactionStatus)}
                </Tooltip>
              </span>
            </li>

            {isSyndicatedLoan ? (
              <>
                <li>
                  <span>{intl.formatMessage(assetCardMessages.borrower)}</span>
                  <span></span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(assetCardMessages.leadArranger)}
                  </span>
                  <span></span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(assetCardMessages.facilityLimit)}
                  </span>
                  <span>
                    {currencyFormat(
                      asset.assetData?.asset?.facilityLimit || 0,
                      getTokenCurrency(asset),
                    )}
                  </span>
                </li>
              </>
            ) : (
              <>
                <li>
                  <span>{intl.formatMessage(assetCardMessages.symbol)}</span>
                  <span>{asset.symbol}</span>
                </li>
                <li>
                  <span>{intl.formatMessage(assetCardMessages.AuM)}</span>
                  <span>
                    {currencyFormat(computeAuM(asset), getTokenCurrency(asset))}
                  </span>
                </li>
              </>
            )}
          </ul>

          <footer>
            <Button
              href={
                hasRole(user, [UserType.INVESTOR, UserType.UNDERWRITER])
                  ? CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
                      assetId: asset.id,
                    })
                  : CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
                      assetId: asset.id,
                    })
              }
              disabled={
                isTransactionRevertedOrFailed ||
                isTransactionPendingOrProcessing ||
                isDeprecated ||
                !assetData
              }
              label={intl.formatMessage(
                assetType === AssetType.SYNDICATED_LOAN
                  ? assetCardMessages.viewLoan
                  : assetCardMessages.viewAsset,
              )}
              size="small"
            />

            {hasRole(user, [UserType.INVESTOR]) &&
              assetType !== AssetType.SYNDICATED_LOAN &&
              !isDeprecated && (
                <Button
                  label={intl.formatMessage(
                    isCommodity
                      ? assetCardMessages.digitalise
                      : assetCardMessages.investNow,
                  )}
                  size="small"
                  tertiary
                  disabled={
                    !orderManagementRules(
                      asset,
                      asset.cycles?.filter(
                        (c) => c.type === PrimaryTradeType.SUBSCRIPTION,
                      )?.[0]?.id,
                    ).canCreateOrder || !assetData
                  }
                  className="investButton"
                  href={CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER.pathBuilder({
                    assetId: asset.id,
                    classKey: asset.assetData?.class[0].key as string,
                  })}
                />
              )}
          </footer>
        </div>
      )}
    </StyledAssetCard>
  );
};

export default React.memo(AssetCard);
