import React from 'react';
import { Network } from 'types/Network';
import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { networkKeys } from 'constants/queryKeys';
import { networksListQuerySelector } from 'features/networks/networks.query';

interface IProps {
  placeholder?: string;
  value?: string;
  onChange: (network: Network) => void;
  onBlur?: () => void;
  dataTestId?: string;
  dataOptionTestId?: string;
  disabled?: boolean;
}

export const SelectNetwork: React.FC<IProps> = (props: IProps) => {
  const { data: networksData, isLoading: isLoadingNetworks } = useQuery(
    networkKeys.all,
    networksListQuerySelector,
    {
      keepPreviousData: true,
    },
  );

  return (
    <Select
      size={'large'}
      style={{ width: '100%' }}
      placeholder={props.placeholder || ''}
      value={props.value}
      onBlur={props.onBlur}
      options={
        networksData?.networks?.map((network: Network, i) => ({
          label: network.name,
          value: network.key,
          'data-test-id': `${props.dataOptionTestId}-${i}`,
        })) || []
      }
      onChange={(networkKey) =>
        props.onChange(
          networksData?.networks?.find((n) => n.key === networkKey) as Network,
        )
      }
      loading={isLoadingNetworks}
      data-test-id={props.dataTestId}
      disabled={props.disabled}
    />
  );
};
