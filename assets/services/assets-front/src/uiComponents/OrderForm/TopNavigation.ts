import { spacing } from 'constants/styles';
import styled from 'styled-components';

export const FormTopNavigation = styled.header`
  border-bottom: 1px solid #eee;
  padding: ${spacing.regular} 0 ${spacing.tight} 0;
  display: flex;
  justify-content: center;
  width: 100%;

  > div {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 ${spacing.tightLooser};

    @media (min-width: 520px) {
      max-width: 528px;
    }

    > span {
      display: block;
      font-weight: 500;
      font-size: 14px;
      color: #989ca6;
      line-height: 1;

      &.active {
        color: #000;
      }
    }

    > svg {
      display: block;
      margin: 0 10px;
    }
  }
`;
