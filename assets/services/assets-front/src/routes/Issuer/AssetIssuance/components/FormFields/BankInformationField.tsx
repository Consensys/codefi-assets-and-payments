import { Col, Row } from 'antd';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { CommonTexts } from 'texts/commun/commonTexts';
import Input from 'uiComponents/Input';
import Label from 'uiComponents/Label';
import Select from 'uiComponents/Select';
import { IIssuanceElement } from '../../insuanceDataType';
import countries, { ICountry } from '../../../../../constants/countries';
import { BankInformation } from '../../assetTypes';
import { IProps as InputProps } from '../../../../../uiComponents/Input';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

const StyledBankInformation = styled.div`
  width: 100%;
`;

const initialValues: BankInformation = {
  country: '',
  currency: '',
  currencyCode: '',
  iban: '',
  recipientName: '',
  accountNumber: '',
  routingNumber: '',
  institutionNumber: '',
  transitNumber: '',
  bsbCode: '',
  sortCode: '',
};

const BankInformationField = ({
  element,
  reviewMode,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  const [selectedCountry, setSelectedCountry] = useState<ICountry>(
    countries[0],
  );
  const [bankInformation, setBankInformation] =
    useState<BankInformation | null>(null);
  useEffect(() => {
    bankInformation &&
      onUpdateData(element.key, [JSON.stringify(bankInformation)]);
    // eslint-disable-next-line
  }, [bankInformation]);
  useEffect(() => {
    if (element.data[0]) {
      const parsedData = JSON.parse(
        element.data[0],
      ) as unknown as BankInformation;
      const country = countries.find((c) => c.country === parsedData.country);
      if (country && country?.country !== selectedCountry?.country)
        setSelectedCountry(country);
      setBankInformation(parsedData);
    } else {
      setBankInformation({
        ...initialValues,
        currency: countries[0].currency,
        currencyCode: countries[0].currencyCode,
        country: countries[0].country,
      });
    }
    // eslint-disable-next-line
  }, []);

  const renderInput = useCallback(
    (props: InputProps, bankInformationKey: keyof BankInformation) =>
      bankInformation ? (
        <Input
          readOnly={reviewMode}
          controlled
          onChange={(_event, value) =>
            setBankInformation({
              ...bankInformation,
              [bankInformationKey]: value || '',
            })
          }
          type={reviewMode ? 'text' : 'number'}
          required
          {...props}
        />
      ) : null,
    [bankInformation, reviewMode],
  );

  const countryCustomInputs = useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    map.set(
      'USA',
      renderInput(
        {
          label: intl.formatMessage(CommonTexts.routingNumber),
          minLength: 9,
          maxLength: 9,
          defaultValue: bankInformation?.routingNumber,
        },
        'routingNumber',
      ),
    );
    map.set(
      'CAN',
      <>
        {renderInput(
          {
            label: intl.formatMessage(CommonTexts.institutionNumber),
            defaultValue: bankInformation?.institutionNumber,
            minLength: 3,
            maxLength: 3,
          },
          'institutionNumber',
        )}
        {renderInput(
          {
            label: intl.formatMessage(CommonTexts.transitNumber),
            defaultValue: bankInformation?.transitNumber,
            minLength: 5,
            maxLength: 5,
          },
          'transitNumber',
        )}
      </>,
    );
    map.set(
      'AUS',
      renderInput(
        {
          label: intl.formatMessage(CommonTexts.bsbCode),
          defaultValue: bankInformation?.bsbCode,
          minLength: 6,
          maxLength: 6,
        },
        'bsbCode',
      ),
    );
    map.set(
      'GB',
      renderInput(
        {
          label: intl.formatMessage(CommonTexts.sortCode),
          defaultValue: bankInformation?.sortCode,
        },
        'sortCode',
      ),
    );
    return map;
  }, [bankInformation, intl, renderInput]);
  return (
    bankInformation && (
      <StyledBankInformation>
        <Row gutter={16}>
          <Col span={14}>
            <Label
              required
              label={intl.formatMessage(CommonTexts.country)}
              disabled={reviewMode}
            />
            {reviewMode ? (
              <Input
                required
                readOnly={reviewMode}
                defaultValue={bankInformation?.country}
              />
            ) : (
              <Select
                options={countries.map((c) => ({
                  label: c.country,
                  value: c.country,
                }))}
                placeholder=" "
                required
                defaultValue={bankInformation?.country}
                onChange={(value) => {
                  const country = countries.find((c) => c.country === value);
                  if (country) {
                    setSelectedCountry(country);
                    setBankInformation({
                      ...initialValues,
                      country: country.country,
                      currency: country.currency,
                      currencyCode: country.currencyCode,
                    });
                  }
                }}
              />
            )}
          </Col>
          <Col span={10}>
            <Input
              label={intl.formatMessage(CommonTexts.currency)}
              required
              readOnly={reviewMode}
              disabled
              controlled
              defaultValue={`${bankInformation?.currency}-${bankInformation?.currencyCode}`}
            />
          </Col>
        </Row>
        {selectedCountry?.length ? (
          <Input
            label={intl.formatMessage(CommonTexts.IBAN)}
            readOnly={reviewMode}
            required
            controlled
            defaultValue={bankInformation?.iban}
            onChange={(_event, value) =>
              setBankInformation({ ...bankInformation, iban: value || '' })
            }
            minLength={parseInt(selectedCountry?.length, 10)}
            maxLength={parseInt(selectedCountry?.length, 10)}
          />
        ) : (
          !selectedCountry?.length && (
            <Input
              label={intl.formatMessage(CommonTexts.accountNumber)}
              required
              readOnly={reviewMode}
              type={reviewMode ? 'text' : 'number'}
              controlled
              defaultValue={bankInformation.accountNumber}
              onChange={(_event, value) =>
                setBankInformation({
                  ...bankInformation,
                  accountNumber: value || '',
                })
              }
            />
          )
        )}
        {countryCustomInputs.get(selectedCountry.code)}
        <Input
          label={intl.formatMessage(CommonTexts.recipientName)}
          required
          readOnly={reviewMode}
          controlled
          defaultValue={bankInformation.recipientName}
          onChange={(_event, value) =>
            setBankInformation({
              ...bankInformation,
              recipientName: value || '',
            })
          }
          maxLength={80}
        />
      </StyledBankInformation>
    )
  );
};

export default BankInformationField;
