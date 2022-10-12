import styled from 'styled-components';

import { spacing, typography } from 'constants/styles';

const StyledInputFile = styled.div`
  display: flex;
  flex-direction: column;

  > div:first-of-type {
    > .subLabel {
      font-size: ${typography.sizeF1};
      margin-top: ${spacing.small};
      color: #666;
    }

    > div {
      display: flex;

      > button {
        border: none;
        background: transparent;
      }
    }
  }

  > div:last-of-type {
    display: flex;
    align-items: center;

    > button {
      margin: 2px 0;
    }

    > .uploading {
      margin-left: ${spacing.small};
      font-size: ${typography.sizeF1};
    }

    > input {
      opacity: 0;
      width: 1px;
      height: 1px;
    }
  }
`;

export default StyledInputFile;
