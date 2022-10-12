import styled from 'styled-components';

import { spacing, typography } from 'constants/styles';

const StyledSelect = styled.div`
  display: block;
  position: relative;

  > .subLabel {
    font-size: ${typography.sizeF1};
    margin-top: ${spacing.small};
    color: #666;
    display: flex;
    align-items: center;

    > svg {
      display: block;
      margin-right: 3px;
    }
  }

  > div {
    position: relative;
    > select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      box-shadow: none;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 3px;
      display: block;
      padding: 11px 30px 12px 15px;
      color: #000;
      font-size: 14px;
      resize: none;
      transition: background 200ms ease-out, border 200ms ease-out;
      width: 100%;
      height: ${spacing.finger};
    }
  }

  > .readOnly {
    font-size: ${typography.sizeF1};
    font-weight: ${typography.weightLightMedium};
  }

  &:not(.readOnly) {
    > div::after {
      content: '▼';
      display: block;
      position: absolute;
      top: 50%;
      right: 12px;
      color: #999;
      font-size: 10px;
      line-height: 1;
      margin-top: -5px;
    }
  }
`;

export default StyledSelect;
