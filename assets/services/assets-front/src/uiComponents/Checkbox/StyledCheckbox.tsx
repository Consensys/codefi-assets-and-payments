import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const StyledCheckbox: React.FC<any> = styled.div`
  align-items: flex-start;
  display: flex;
  margin: ${spacing.small} 0;
  position: relative;

  > input {
    -webkit-appearance: none;
    align-items: center;
    appearance: none;
    background-color: #fff;
    border-radius: 3px;
    border: 2px solid #999;
    cursor: pointer;
    display: flex;
    height: 18px;
    justify-content: center;
    margin-right: ${spacing.small};
    margin-top: 2px;
    transition: background-color 200ms ease-out, border 200ms ease-out;
    width: 18px;
    flex-shrink: 0;
    flex-grow: 0;
    box-shadow: none;

    &:hover {
      border-color: ${(props: any) => props.colorMain || colors.main};
    }

    &:checked {
      background-color: ${(props: any) => props.colorMain || colors.main};
      border-color: ${(props: any) => props.colorMain || colors.main};

      & ~ label {
        color: #000;
      }

      & ~ svg {
        opacity: 1;
        transform: scale(1);
      }
    }

    &:disabled {
      border-color: #ccc !important;
      cursor: not-allowed;

      & ~ label {
        cursor: not-allowed;
        color: #ccc;
      }

      &:checked {
        background-color: #ccc;

        & ~ label {
          color: #000;
        }
      }
    }
  }

  > svg {
    display: block;
    left: 3px;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    top: 4px;
    transform: scale(3);
    transition: opacity 200ms ease-out, transform 200ms ease-in;
  }

  > label {
    cursor: pointer;
    display: flex;
    font-size: ${typography.sizeF1};

    a {
      color: ${(props: any) => props.colorMain || colors.main};
    }
  }
`;

export default StyledCheckbox;
