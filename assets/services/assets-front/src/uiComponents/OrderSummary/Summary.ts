import { spacing, typography, colors } from 'constants/styles';
import styled from 'styled-components';
import { Card } from 'uiComponents/Card';

export const OrderSummary = styled(Card)`
  width: 100%;
  margin: ${spacing.small} 0;

  > h2 {
    font-size: ${typography.sizeF1};
    font-weight: ${typography.weightBold};
    color: ${colors.mainText};
    padding: ${spacing.tight} ${spacing.tightLooser};
  }

  > ul {
    padding: 0 ${spacing.tightLooser};

    > li {
      list-style: none;
      font-size: ${typography.sizeF1};
      display: flex;
      align-items: center;
      color: #777c8c;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
      padding: ${spacing.small} 0;
      line-height: 1;

      &.bold {
        font-weight: ${typography.weightBold};

        > span:nth-child(even) {
          color: ${colors.mainText};
        }
      }
    }
  }
`;
