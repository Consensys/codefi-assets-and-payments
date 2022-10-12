import styled from 'styled-components';

import { thresholdMobile, spacing, typography, colors } from 'constants/styles';

const StyledInvestmentProducts = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  .tableActions {
    > div:first-of-type {
      display: none;
    }
  }
  > .emptyState {
    height: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    > h2 {
      font-size: var(--typography-size-f3);
      font-weight: var(--typography-weight-medium);
      margin: var(--spacing-tight-looser) 0;
    }

    > p {
      margin-bottom: var(--spacing-tight-looser);
      color: #444;
    }
  }

  main {
    display: flex;
    flex-wrap: wrap;
    padding: var(--spacing-tight) var(--spacing-regular);

    @media screen and (min-width: 1000px) {
      padding: var(--spacing-tight-looser) var(--spacing-finger);
    }

    > .selectContainer {
      width: 100%;
      margin-bottom: 20px;

      > .select {
        width: 200px !important;
      }
    }
  }
  .status {
    display: block;
    font-size: ${typography.sizeF1};
    border-radius: 4px;
    padding: 5px;
    font-weight: ${typography.weightLightMedium};
    &.deployed {
      color: #008055;
      background: #f2fcf6;
      border: 0.5px solid #dff2ea;
    }

    &.pending {
      color: ${colors.main};
      background: #fcf5f5;
      border: 0.5px solid #e6f1ff;
    }

    &.reverted {
      color: #b20000;
      background: #fcf5f5;
      border: 0.5px solid #faebeb;
    }

    &.deprecated {
      color: #fff;
      background: ${colors.warning};
      border: 0.5px solid ${colors.warning};
    }
    &.draft {
      border: 0.5px solid #c7dcf7;
      color: #4f56fd;
      background: #f9f9ff;
    }
  }
  > footer {
    border-top: 1px solid #dfe0e6;
    margin: ${spacing.tightLooser} ${spacing.regular};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;

    @media (min-width: ${thresholdMobile}) {
      flex-direction: row;
      margin: ${spacing.tightLooser} ${spacing.finger};
    }

    > span {
      font-size: ${typography.sizeF0};
      color: #777c8c;
    }
  }
`;

export default StyledInvestmentProducts;
