import { spacing } from 'constants/styles';
import styled from 'styled-components';

export const Form = styled.form`
  > .field {
    margin-bottom: 16px;

    > label {
      color: #191919;
      font-size: 14px;
      font-weight: 500;
    }
  }

  > p {
    margin-bottom: ${spacing.tightLooser};
  }
`;
