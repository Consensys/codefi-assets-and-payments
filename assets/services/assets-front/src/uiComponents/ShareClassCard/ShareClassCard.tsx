import React from 'react';

import './ShareClassCard.scss';
import { ValueVariationIndicator } from '../ValueVariationIndicator';
import Button from '../Button';
import { Card } from '../Card';
import { CLIENT_ROUTE_ASSET_SHARECLASS } from 'routesList';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { useDispatch } from 'react-redux';
import UpdateNavDialog from 'routes/Issuer/FundInvestors/dialogs/UpdateNavDialog';
import { currencyFormat } from 'utils/currencyFormat';
import { formatDate } from 'utils/commonUtils';
import {
  ClassData,
  combineDateAndTime,
} from 'routes/Issuer/AssetIssuance/assetTypes';
import { setAppModal } from 'features/user/user.store';

interface IProps {
  token: IToken;
  assetClassData: ClassData;
  reloadData: () => void;
}

const localeFormatDate = (date: Date | undefined) => {
  if (!date) {
    return '-';
  }
  return formatDate(new Date(date));
};

export const ShareClassCard: React.FC<IProps> = ({
  token,
  assetClassData,
  reloadData,
}: IProps) => {
  const dispatch = useDispatch();

  return (
    <Card className="_uiComponent_shareClassCard">
      <header>
        <h2>{assetClassData.name || assetClassData.key}</h2>
        {assetClassData.isin && <p>{assetClassData.isin}</p>}
      </header>

      {/* <div className="nextEvent">nextEvent</div> */}

      <ul>
        <li>
          <span>Cut-off date</span>
          <span>
            {localeFormatDate(
              combineDateAndTime(
                assetClassData.initialSubscription.valuationDate,
                assetClassData.initialSubscription.valuationHour,
              ),
            )}
          </span>
        </li>
        <li>
          <span>Settlement date</span>
          <span>
            {localeFormatDate(
              combineDateAndTime(
                assetClassData.initialSubscription.settlementDate,
                assetClassData.initialSubscription.settlementHour,
              ),
            )}
          </span>
        </li>
        {assetClassData.shareType && (
          <li>
            <span>Share type</span>
            <span>{assetClassData.shareType}</span>
          </li>
        )}
        <li>
          <span>Shares in circulation</span>
          <span>-</span>
        </li>
      </ul>

      {assetClassData.nav && (
        <div className="nav">
          <div className="title">{`NAV at -`}</div>
          <div className="value">
            {currencyFormat(assetClassData.nav.value || 0)}
            <ValueVariationIndicator
              style={{ marginLeft: '10px' }}
              variation={'up' as 'up' | 'down' | 'neutral'}
            />
          </div>
        </div>
      )}

      <footer>
        <Button
          label="View Share Class"
          href={CLIENT_ROUTE_ASSET_SHARECLASS.pathBuilder({
            assetId: token.id,
            shareClassId: assetClassData.key,
          })}
        />
        <Button
          label="Update NAV"
          tertiary
          onClick={() => {
            dispatch(
              setAppModal(
                appModalData({
                  title: 'Update NAV',
                  content: (
                    <UpdateNavDialog token={token} callback={reloadData} />
                  ),
                  closeIcon: true,
                  noPadding: true,
                }),
              ),
            );
          }}
        />
      </footer>
    </Card>
  );
};
