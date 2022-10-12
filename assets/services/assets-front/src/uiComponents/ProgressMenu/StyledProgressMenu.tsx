import styled from 'styled-components';

import { colors, spacing, typography } from 'constants/styles';

const TEST_ID = 'progressMenu';
const StyledProgressMenu = styled.menu.attrs({
  'data-test-id': TEST_ID,
})`
  position: sticky;
  margin-left: ${spacing.loose};
  min-width: 150px;

  > h2 {
    font-size: ${typography.sizeF3};
    font-weight: ${typography.weightBold};
    margin-bottom: ${spacing.tightLooser};
  }

  > ul {
    margin-bottom: 15px;
    > li {
      display: block;
      padding: ${spacing.small} ${spacing.tight};
      list-style: none;
      border-left: 2px solid #eee;

      &.active {
        border-left: 2px solid ${colors.main};

        > span.label {
          font-weight: ${typography.weightBold};
          color: ${colors.main};
        }
      }

      > span {
        display: block;

        &.status {
          display: flex;
          align-items: center;
          font-size: ${typography.sizeF0};
          color: #666;
        }

        &.complete {
          color: ${colors.successDark};
        }

        > svg {
          display: block;
          margin-right: ${spacing.xs};
        }
      }
    }
  }

  > a > button {
    margin-top: 15px;
    width: 100%;
  }
`;

export default StyledProgressMenu;
