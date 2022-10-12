import React from 'react';

import UndrawOnboarding from 'uiComponents/UndrawOnboarding';
import './EmptyListStyles.scss';

interface IProps {
  title: string;
  message: string;
}

const EmptyList: React.FC<IProps> = ({ title, message }: IProps) => {
  return (
    <div className="_route_investorManagement_emptyList">
      <UndrawOnboarding />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
};

export default EmptyList;
