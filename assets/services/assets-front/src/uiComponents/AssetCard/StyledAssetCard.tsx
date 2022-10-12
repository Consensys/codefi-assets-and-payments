import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const StyledAssetCard = styled.div`
  width: calc(100% - 30px);
  max-width: 350px;
  background: #fff;
  border: 1px solid #e6e6e6;
  box-sizing: border-box;
  box-shadow: rgba(0, 0, 0, 0.05) 0 4px 10px;
  border-radius: 8px;
  margin: 0 ${spacing.tightLooser} ${spacing.tightLooser} 0;

  > header {
    background: linear-gradient(
      152.34deg,
      ${colors.main} 17.68%,
      ${colors.sidebarText} 86.46%
    );
    background-size: cover;
    background-position: 50% 50%;
    height: 180px;
    display: flex;
    align-items: center;
  }
  > .title {
    width: 100%;
    color: #1a2233;
    display: flex;
    align-items: flex-start;
    padding: ${spacing.tightLooser};
    padding-bottom: 0px;
    justify-content: center;
    flex-direction: column;

    > div {
      font-weight: 600;
      font-size: ${typography.sizeF4};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    > .date {
      font-size: ${typography.sizeF0};
      opacity: 0.75;
    }
  }
  > .draftInfos {
    padding: ${spacing.tightLooser};

    > p {
      color: #777;
      margin-bottom: ${spacing.finger};
    }

    > a > button,
    > button {
      width: 100%;
      margin-bottom: 15px;
    }
  }

  > .assetInfos {
    padding: ${spacing.tightLooser};

    > ul {
      padding-bottom: ${spacing.tightLooser};

      > li {
        list-style-type: none;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;

        &:last-of-type {
          border-bottom: none;
          font-weight: bold;
        }

        > span {
          display: block;
          font-size: ${typography.sizeF1};

          &.deployed {
            color: #008055;
            background: #f2fcf6;
            border: 0.5px solid #dff2ea;
            border-radius: 4px;
            padding: 5px;
            font-weight: ${typography.weightMedium};
          }

          &.pending {
            color: ${colors.main};
            background: #fcf5f5;
            border: 0.5px solid #e6f1ff;
            border-radius: 4px;
            padding: 5px;
            font-weight: ${typography.weightMedium};
          }

          &.reverted {
            color: #fff;
            background: ${colors.errorDark};
            border: 0.5px solid ${colors.errorDark};
            border-radius: 4px;
            padding: 5px;
            font-weight: ${typography.weightMedium};
          }

          &.deprecated {
            color: #fff;
            background: ${colors.warning};
            border: 0.5px solid ${colors.warning};
            border-radius: 4px;
            padding: 5px;
            font-weight: ${typography.weightMedium};
          }

          &:first-of-type {
            color: #777;
          }
        }
      }
    }

    > footer {
      display: flex;
      flex-direction: column;
      width: 100%;

      > a,
      > button {
        display: block;
        width: 100%;
        text-align: center;

        &.investButton {
          margin-top: 10px;

          > span {
            text-align: center;
            display: block;
          }
        }

        > button {
          width: 100%;
        }
      }
    }
  }
`;

export default StyledAssetCard;
