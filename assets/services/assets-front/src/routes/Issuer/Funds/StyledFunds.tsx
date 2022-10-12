import styled from 'styled-components';

import { thresholdMobile, spacing, typography, colors } from 'constants/styles';

const StyledFunds = styled.div`
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
      font-size: ${typography.sizeF3};
      font-weight: ${typography.weightMedium};
      margin: ${spacing.tightLooser} 0;
    }

    > p {
      margin-bottom: ${spacing.tightLooser};
      color: #444;
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

    &.preInitialized {
      color: ${colors.errorDark};
      background: ${colors.errorLighter};
      border: 0.5px solid ${colors.error};
    }

    &.submitted {
      color: #4f53db;
      background: #f9f9ff;
      border: 0.5px solid #e6f1ff;
    }

    &.rejected {
      color: ${colors.errorDark};
      background: ${colors.errorLighter};
      border: 0.5px solid ${colors.error};
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
  .funds-wrapper {
    padding: ${spacing.tight} ${spacing.regular};
  }
  .fundsContainer {
    display: flex;
    flex-wrap: wrap;
    padding: ${spacing.tight} 0;

    @media screen and (min-width: ${thresholdMobile}) {
      padding: ${spacing.tightLooser} 0;
    }
  }
  .selectContainer {
    width: 100%;

    > .select {
      width: 200px !important;
    }
  }
  .footer {
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

export default StyledFunds;
