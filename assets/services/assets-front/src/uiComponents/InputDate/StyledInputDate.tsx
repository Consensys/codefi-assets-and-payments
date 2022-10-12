import styled from 'styled-components';

import { spacing, typography } from 'constants/styles';

const StyledInput = styled.div`
  display: block;

  &.disabled * {
    cursor: not-allowed;
    opacity: 0.75;
  }

  > .readOnly {
    font-size: ${typography.sizeF1};
    font-weight: ${typography.weightLightMedium};
  }

  > .subLabel {
    font-size: ${typography.sizeF1};
    margin-top: ${spacing.small};
    color: #666;
    display: flex;
    align-items: center;
    white-space: pre-wrap;
    margin-bottom: ${spacing.small};

    > svg {
      display: block;
      margin-right: 3px;
    }
  }

  > div {
    position: relative;
    background: #fff;
    border-radius: 4px;
    border: 1px solid #ddd;
    overflow: hidden;
    display: flex;

    > input {
      color: #000;
      display: block;
      font-size: ${typography.sizeF2};
      height: 48px;
      padding: 0 ${spacing.tight};
      resize: none;
      transition: background 200ms ease-out, border 200ms ease-out;
      width: 100%;
      border: 1px solid transparent;
      box-shadow: none;
      &::placeholder {
        color: #999;
      }

      &:focus,
      &:hover {
        border: 1px solid #2c56dd;
        outline: none;
      }
    }

    > svg {
      left: 15px;
      position: absolute;
      top: 15px;
    }

    > div {
      background: #eee;
      display: flex;
      align-items: center;
      padding: 0 20px;

      &.right {
        border-left: 1px solid #ddd;
      }

      &.left {
        border-right: 1px solid #ddd;
      }

      &.tag {
        white-space: nowrap;
      }
    }
  }

  &.hasIcon > div > input {
    padding-left: 43px;
  }
`;

export default StyledInput;
