import React, { useEffect, useState } from 'react';
import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

import mockupData from './mockupData.json';

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  data?: JSONObject;
}

export const FundShareClassInfos: React.FC = () => {
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
  });

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    // TODO: load real data
    setTimeout(() =>
      setState((s) => ({
        ...s,
        isLoading: false,
        data: mockupData,
      })),
    );
  };

  if (state.isLoading) {
    return <PageLoader />;
  }

  if (state.hasLoadingError) {
    return <PageError />;
  }

  return (
    <div>
      <PageTitle
        title="FundShareClassInfos"
        backLink={{
          label: '#',
          to: '#',
        }}
      />
    </div>
  );
};
