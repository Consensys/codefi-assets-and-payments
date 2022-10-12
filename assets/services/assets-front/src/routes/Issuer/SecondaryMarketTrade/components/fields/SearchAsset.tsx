import React from 'react';
import { AutoComplete, Checkbox, Input, Select } from 'antd';
import { tokenKeys } from '../../../../../constants/queryKeys';
import { IToken } from '../../../AssetIssuance/templatesTypes';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { shortifyAddress } from '../../../../../utils/commonUtils';
import { useIntl } from 'react-intl';
import { tradesTexts } from '../../../../../texts/routes/issuer/trades';
import useTokens from '../../../../../hooks/useTokens';

interface IProps {
  value?: IToken;
  assetClassValue?: string;
  queryValue: string;
  assetHasClasses: boolean;
  allowAddressValue?: boolean;
  onChangeQueryValue: (value: string) => void;
  onChangeAssetHasClasses: (value: boolean) => void;
  onChangeAssetClass: (value: string) => void;
  onSearch: (data: string) => void;
  onSelect: (event: IToken) => void;
  onBlur?: () => void;
  disabled?: boolean;
  dataTestId?: string;
  dataOptionTestId?: string;
}

export const SearchAsset: React.FC<IProps> = (props: IProps) => {
  const intl = useIntl();
  const { data, isLoading: isLoadingAssets } = useTokens(
    tokenKeys.funds(0, 10, false, false, false, props.queryValue),
  );

  return (
    <>
      <AutoComplete
        value={props.queryValue}
        style={{ width: '100%' }}
        options={data?.tokens?.map((a, i) => ({
          label: a.name,
          value: a.id,
          'data-test-id': `${props.dataOptionTestId}-${i}`,
        }))}
        onSearch={props.onSearch}
        onBlur={props.onBlur}
        onSelect={(assetId) =>
          props.onSelect(
            data?.tokens?.find((asset) => asset.id === assetId) as IToken,
          )
        }
        disabled={props.disabled}
      >
        <Input
          prefix={<SearchOutlined />}
          suffix={isLoadingAssets ? <LoadingOutlined /> : null}
          size={'large'}
          value={props.queryValue}
          onChange={(e) => props.onChangeQueryValue(e.target.value)}
          placeholder={intl.formatMessage(tradesTexts.searchAnAsset)}
          disabled={props.disabled}
          data-test-id={props.dataTestId}
        />
      </AutoComplete>

      {props.value && (
        <p className={'create-trade-form__field__control__tertiary'}>
          {shortifyAddress(props.value?.defaultDeployment || '', 4, 4)}
          {props.assetClassValue && ` / ${props.assetClassValue}`}
        </p>
      )}

      {(!props.value?.id || !props.value?.assetClasses) && (
        <Checkbox
          style={{ marginTop: '0.5em' }}
          checked={props.assetHasClasses}
          onChange={(e) => props.onChangeAssetHasClasses(e.target.checked)}
          disabled={props.disabled}
        >
          Asset has Classes or Items
        </Checkbox>
      )}

      {props.assetHasClasses &&
        props.value?.assetClasses &&
        props.value?.assetClasses?.length > 1 && (
          <Select
            size={'large'}
            style={{ width: '100%', marginTop: '0.5em' }}
            placeholder={intl.formatMessage(tradesTexts.selectAClass)}
            value={props.assetClassValue}
            options={
              props.value?.assetClasses?.map((assetClass: string) => ({
                label: assetClass,
                value: assetClass,
              })) || []
            }
            disabled={props.disabled || props.value.assetClasses.length === 1}
            onChange={props.onChangeAssetClass}
          />
        )}
    </>
  );
};
