import React, { ReactNode } from 'react';
import { spacing } from 'constants/styles';
import styled from 'styled-components';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

const StyledWrapper = styled.div`
  margin: 0 ${spacing.regular};
  & main {
    margin-top: ${spacing.regular};
  }
  & > :first-child {
    margin-left: 0px;
    margin-right: 0px;
  }
`;

interface IPageWrapper {
  isLoading?: boolean;
  isError?: boolean;
  children: ReactNode;
}

const PageWrapper = ({ children, isError, isLoading }: IPageWrapper) => {
  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return <PageError />;
  }
  return <StyledWrapper>{children}</StyledWrapper>;
};

export default PageWrapper;
