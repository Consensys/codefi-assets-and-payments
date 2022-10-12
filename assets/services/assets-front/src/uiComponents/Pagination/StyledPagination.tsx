import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const StyledPagination = styled.div`
  display: flex;
  align-items: center;
  margin: ${spacing.tight} 0;

  > a,
  > button {
    background-color: #fff;
    text-decoration: none;
    color: #475166;
    font-size: ${typography.sizeF1};
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${spacing.regular};
    padding: 0 12px;
    border: none;
    border-radius: 2px;
    font-weight: ${typography.weightBold};
    margin: 0 ${spacing.xs};
    line-height: ${spacing.regular};
    transition: color 200ms ease-out, border-color 200ms ease-out;
    flex-grow: 0;
    flex-shrink: 0;

    &.active {
      background-color: ${colors.main};
      color: #fff;

      > svg {
        fill: ${colors.main} !important;
      }
    }

    &.active {
      cursor: default;
    }

    &.chevron {
      padding: 0 ${spacing.xs};
    }

    &:first-of-type {
      margin-left: 0;
    }

    &:last-of-type {
      margin-right: 0;
    }
  }

  > .dots {
    margin: 0 ${spacing.small};
    height: ${spacing.regular};
    display: flex;
    align-items: center;
    justify-content: center;

    > svg {
      display: block;
    }
  }
`;

export default StyledPagination;
