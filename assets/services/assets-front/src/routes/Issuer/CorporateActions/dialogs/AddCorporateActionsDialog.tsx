import React, { useState, FormEvent } from 'react';
import '../CorporateActionsStyles.scss';

import { API_CREATE_EVENT } from 'constants/apiRoutes';
import { DataCall } from 'utils/dataLayer';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { getProductFromToken } from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { DatePicker, TimePicker } from 'antd';
import { corporateActionsDialog } from 'texts/routes/issuer/corporateActions';
import Select from 'uiComponents/Select';
import Input from 'uiComponents/Input';
import { decimalisationValue } from 'utils/currencyFormat';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  token: IToken;
  callback: () => void;
}

const AddCorporateActionsDialog = ({ token, callback }: IProps) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>();
  const [corporateActionType, setCorporateActionType] = useState<string>();
  const [corporateActionDate, setCorporateActionDate] = useState<string>();
  const [corporateActionTime, setCorporateActionTime] = useState<string>();

  const { shareClasses } = getProductFromToken(token);
  const decimalisation = decimalisationValue(shareClasses[0].decimalisation);

  return (
    <form
      style={{ width: 580 }}
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        try {
          event.preventDefault();
          setLoading(true);
          const settlementDate = new Date(
            `${corporateActionDate}T${corporateActionTime}`,
          );
          await DataCall({
            method: API_CREATE_EVENT.method,
            path: API_CREATE_EVENT.path(),
            body: {
              tokenId: token.id,
              assetClass: shareClasses[0].key,
              eventType: corporateActionType,
              settlementDate,
              amount: totalAmount,
            },
          });
          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback();
        } catch (error) {
          setLoading(false);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                corporateActionsDialog.addCorporateActionsError,
              ),
              secondaryMessage: String(error),
              icon: mdiAlertOctagon,
              color: colors.error,
              isDark: true,
            }),
          );
        }
      }}
    >
      <div className="corporateActionsDialog">
        <div className="corporateActionTime">
          <div>
            <p>
              {intl.formatMessage(corporateActionsDialog.corporateActionDate)}
            </p>
            <DatePicker
              size="large"
              format="YYYY-MM-DD"
              placeholder="dd / mm / yyyy"
              onChange={(_, dateString) => {
                setCorporateActionDate(dateString);
              }}
            />
          </div>
          <div>
            <p>
              {intl.formatMessage(corporateActionsDialog.corporateActionTime)}
            </p>
            <TimePicker
              size="large"
              placeholder={intl.formatMessage(
                corporateActionsDialog.selectHour,
              )}
              onChange={(_, timeString) => {
                setCorporateActionTime(timeString);
              }}
            />
          </div>
        </div>
        <div>
          <Select
            label={intl.formatMessage(corporateActionsDialog.type)}
            required
            options={[
              {
                label: intl.formatMessage(corporateActionsDialog.coupon),
                value: 'COUPON',
              },
              {
                label: intl.formatMessage(corporateActionsDialog.redemption),
                value: 'REDEMPTION',
              },
            ]}
            onChange={(value) => setCorporateActionType(value)}
            placeholder={intl.formatMessage(corporateActionsDialog.selectType)}
          />
        </div>
        <div>
          <Input
            rightTag={shareClasses[0].currency}
            type="number"
            step={decimalisation}
            onChange={(event) =>
              setTotalAmount(
                event.currentTarget.value
                  ? parseFloat(event.currentTarget.value)
                  : 0,
              )
            }
            label={intl.formatMessage(corporateActionsDialog.totalAmount)}
            placeholder="0"
            required
          />
        </div>
        <div className="corporateActionConfirmation">
          <Checkbox
            required
            label={intl.formatMessage(
              corporateActionsDialog.corporateActionConfirmation,
            )}
          />
        </div>
      </div>
      <footer className="footer">
        <Button
          label={intl.formatMessage(
            corporateActionsDialog.cancelCorporateAction,
          )}
          onClick={() => {
            EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          }}
          tertiary
          color="#333"
        />
        <Button
          style={{ marginLeft: '16px' }}
          type="submit"
          label={intl.formatMessage(
            corporateActionsDialog.createCorporateAction,
          )}
          isLoading={loading}
          size="small"
        />
      </footer>
    </form>
  );
};

export default AddCorporateActionsDialog;
