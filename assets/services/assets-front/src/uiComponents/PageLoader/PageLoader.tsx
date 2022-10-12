import React from 'react';
import CSS from 'csstype';

import Loader from 'uiComponents/Loader';

import './pageLoaderStyles.scss';

interface IProps {
  readonly className?: string;
  readonly id?: string;
  readonly label?: string;
  readonly style?: CSS.Properties;
}

const PageLoader: React.FC<IProps> = ({
  className = '',
  id,
  label,
  style = {},
}: IProps) => {
  return (
    <div
      className={`uiComponent_pageLoader ${className}`}
      id={id}
      style={style}
    >
      <Loader width={100} label={label || 'Loading...'} />
    </div>
  );
};

export default PageLoader;
