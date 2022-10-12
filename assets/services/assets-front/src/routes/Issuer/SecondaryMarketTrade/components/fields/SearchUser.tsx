import React from 'react';
import { AutoComplete, Input } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { tokenKeys } from '../../../../../constants/queryKeys';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { searchAssetInvestorsByNameOrAddressQuerySelector } from '../../../../../features/assets/assets.query';
import { IUser } from '../../../../../User';

interface IProps {
  value: IUser | undefined;
  assetId: string | undefined;
  queryValue: string;
  onSearch: (data: string) => void;
  onSelect: (event: IUser) => void;
  onBlur?: () => void;
  disabled?: boolean;
  dataTestId?: string;
  dataOptionTestId?: string;
}

export const SearchUser: React.FC<IProps> = (props: IProps) => {
  const { data: usersSearchData, isLoading: isLoadingUsers } = useQuery(
    tokenKeys.searchInvestors(props.assetId || '', props.queryValue, 10, 0),
    () =>
      searchAssetInvestorsByNameOrAddressQuerySelector(
        props.assetId || '',
        props.queryValue,
      ),
    {
      enabled: props.queryValue.length > 2 && !!props.assetId, // search starts if query > 2 chars
      staleTime: 5 * 60 * 1000, // 5 mins cache
    },
  );

  return (
    <>
      <AutoComplete
        value={props.queryValue}
        style={{ width: '100%' }}
        options={usersSearchData?.users?.map((user, i) => ({
          label: `${user.firstName} ${user.lastName}${
            user.data?.clientName ? ` (${user.data?.clientName})` : null
          }`,
          value: user.defaultWallet || '',
          'data-test-id': `${props.dataTestId}-${i}`,
        }))}
        onSearch={props.onSearch}
        onSelect={(wallet) =>
          props.onSelect(
            usersSearchData?.users?.find(
              (user) => user.defaultWallet === wallet,
            ) as IUser,
          )
        }
        onBlur={props.onBlur}
        disabled={props.disabled}
      >
        <Input
          prefix={<SearchOutlined />}
          suffix={isLoadingUsers ? <LoadingOutlined /> : null}
          size={'large'}
          value={props.queryValue}
          onChange={(e) => props.onSearch(e.target.value)}
          placeholder={'Search asset or enter an address'}
          disabled={props.disabled}
          data-test-id={props.dataTestId}
        />
      </AutoComplete>
      {props.value && (
        <p className={'create-trade-form__field__control__tertiary'}>
          {props.value?.defaultWallet?.substr(0, 4)}
          ...
          {props.value?.defaultWallet?.substr(
            props.value?.defaultWallet?.length - 4,
            props.value?.defaultWallet?.length,
          )}
        </p>
      )}
    </>
  );
};
