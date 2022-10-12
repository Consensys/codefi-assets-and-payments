import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const TEST_ID = 'progressMenu';
const StyledMultiPageFormProgressMenu = styled.aside.attrs({
  'data-test-id': TEST_ID,
})`
  width: 248px;
  padding-top: ${spacing.finger};
  position: sticky;
  top: 0;
  padding-left: ${spacing.finger};

  @media (max-width: 950px) {
    display: none;
  }

  > h2 {
    font-size: ${typography.sizeF3};
    font-weight: ${typography.weightMedium};
    margin-bottom: ${spacing.regular};
  }

  > ul {
    margin-bottom: ${typography.sizeF7};
    border-left: 1px solid #eee;

    > li {
      list-style: none;
      padding-left: ${spacing.tightLooser};
      display: block;
      margin-bottom: ${spacing.tightLooser};
      transform: translateX(-1px);

      > span {
        display: block;
      }

      > .stepName {
        font-size: ${typography.sizeF2};
        color: #999;
      }

      > .stepCount {
        font-size: ${typography.sizeF1};
        color: #777;
      }

      > .complete {
        color: ${colors.successDark};
        font-size: ${typography.sizeF1};
        display: flex;
        align-items: center;

        > svg {
          display: block;
          margin-right: ${spacing.xs};
        }
      }

      &.active {
        border-left: 2px solid ${colors.main};

        > .stepName {
          color: ${colors.main};
          font-weight: ${typography.weightMedium};
        }
      }
    }
  }

  > button {
    margin-top: ${typography.sizeF4};
    width: 100%;
  }
`;

export default StyledMultiPageFormProgressMenu;
