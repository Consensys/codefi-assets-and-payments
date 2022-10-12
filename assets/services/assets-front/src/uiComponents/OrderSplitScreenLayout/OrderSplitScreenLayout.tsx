import { spacing } from 'constants/styles';
import React, { ReactNode, ReactNodeArray } from 'react';
import styled from 'styled-components';

const StyledOrderSplitScreenLayout = styled.main`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);

  @media (min-width: 1050px) {
    flex-direction: row;
  }
`;

const StyledSideBar = styled.div`
  background: #f6f6f6;
  width: 100%;
  flex-shrink: 0;
  flex-grow: 1;
  padding: ${spacing.tightLooser} ${spacing.tight};
  display: flex;
  align-items: center;
  flex-direction: column;

  @media (min-width: 1050px) {
    width: 50%;
    padding-top: 80px;
  }
  > div {
    width: 100%;
    margin-left: ${spacing.tightLooser};
    margin-right: ${spacing.tightLooser};

    @media (min-width: 520px) {
      max-width: 528px;
    }

    @media (min-width: 1050px) {
      width: 80%;
    }
  }
`;

const StyledMainContent = styled.div`
  border-right: 1px solid #eee;
  width: 100%;
  flex-shrink: 0;
  flex-grow: 0;
  padding: ${spacing.tight} 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (min-width: 1050px) {
    width: 50%;
  }

  > form,
  > div {
    width: 100%;
    padding: 0 ${spacing.tightLooser};

    @media (min-width: 520px) {
      max-width: 528px;
    }

    > p {
      font-weight: 400;
      font-size: 16px;
      line-height: 150%;
      color: #475166;
    }
  }
`;

export const OrderSplitScreenLayout = ({
  children,
}: {
  children: ReactNode | ReactNodeArray;
}) => <StyledOrderSplitScreenLayout>{children}</StyledOrderSplitScreenLayout>;

export const OrderSplitScreenSideBar = ({
  children,
}: {
  children: ReactNode | ReactNodeArray;
}) => <StyledSideBar>{children}</StyledSideBar>;

export const OrderSplitScreenMainContent = ({
  children,
}: {
  children: ReactNode | ReactNodeArray;
}) => <StyledMainContent>{children}</StyledMainContent>;

export default OrderSplitScreenLayout;
