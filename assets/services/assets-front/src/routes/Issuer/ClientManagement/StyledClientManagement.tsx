import styled from 'styled-components';

import { thresholdMobile, spacing, typography } from 'constants/styles';

const StyledClientManagement = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);

  > main {
    padding: ${spacing.tight} ${spacing.regular};
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
  }

  > .clientsFilter {
    padding: ${spacing.tight} ${spacing.regular} ${spacing.none};
    display: flex;
    flex-direction: row;
    margin-bottom: ${spacing.small};
    > div {
      margin-right: 5px;
      select {
        background: #f0f0f2;
        border: 1px solid #f0f0f2;
        border-radius: 3px;
        color: #475166;
        width: 175px;
        height: 32px;
        padding: 5px 5px 5px 10px;
        option {
          flex: none;
          order: 0;
          flex-grow: 0;
          margin: 0px 8px;
        }
      }
    }
  }

  > footer {
    margin: ${spacing.tightLooser} ${spacing.regular};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
    @media (min-width: ${thresholdMobile}) {
      flex-direction: row;
      margin: ${spacing.tightLooser} ${spacing.finger};
    }

    > div {
      display: flex;
      flex-direction: row;
      > span {
        font-size: ${typography.sizeF0};
        color: #777c8c;
        margin: auto;
      }

      div {
        padding-left: 10px;
        select {
          height: 30px;
          width: 55px;
          padding: 5px 5px 5px 10px;
        }
      }
    }
  }
`;

export default StyledClientManagement;
