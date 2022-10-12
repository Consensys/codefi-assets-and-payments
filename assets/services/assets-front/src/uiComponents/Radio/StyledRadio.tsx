import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const radioTopMargin = '3px';

const StyledRadio: React.FC<any> = styled.div`
  align-items: flex-start;
  display: flex;
  margin: ${spacing.small} 0;
  position: relative;

  > input {
    position: absolute;
    opacity: 0;
    box-shadow: none;
    pointer-events: none;

    &:hover {
      & ~ label {
        &::before {
          border-color: ${(props: any) => props.colorMain || colors.main};
        }
      }
    }

    &:checked {
      background-color: ${(props: any) => props.colorMain || colors.main};
      border-color: ${(props: any) => props.colorMain || colors.main};

      & ~ label {
        &::before {
          border-color: ${(props: any) => props.colorMain || colors.main};
        }
        &::after {
          transform: scale(1);
        }
      }
    }

    &:disabled {
      border-color: #ccc !important;
      cursor: not-allowed;

      & ~ label {
        cursor: not-allowed;
        color: #ccc;
      }
    }
  }

  > label {
    cursor: pointer;
    display: flex;
    font-size: ${typography.sizeF1};

    &::before {
      content: '';
      background-color: #fff;
      position: 'relative';
      display: block;
      width: 16px;
      height: 16px;
      border: 2px solid #999;
      border-radius: 16px;
      cursor: pointer;
      margin-right: ${spacing.small};
      transition: border-color 200ms ease-out;
      margin-top: ${radioTopMargin};
    }

    &::after {
      content: '';
      margin-top: ${radioTopMargin};
      display: block;
      background-color: ${(props: any) => props.colorMain || colors.main};
      position: absolute;
      top: 4px;
      left: 4px;
      width: 8px;
      height: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 200ms ease-out;
      transform: scale(0);
    }
  }
`;

export default StyledRadio;
