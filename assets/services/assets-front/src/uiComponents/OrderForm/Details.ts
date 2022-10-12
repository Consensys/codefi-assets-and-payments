import styled from 'styled-components';
import { typography } from 'constants/styles';

export const Details = styled.ul`
  margin-top: 24px;

  > p {
    font-size: ${typography.sizeF2};
    line-height: 150%;
    color: #475166;
    margin-bottom: 32px;
  }

  > h3 {
    font-weight: 500;
    color: #000a28;
  }

  > footer {
    padding-top: 32px;

    > button {
      margin-top: 16px;
    }
  }

  > li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #eee;
    padding: 8px 0;

    &:last-of-type {
      border-bottom: none;
      font-weight: 600;
    }

    > span {
      display: block;
      font-size: 14px;
      color: #777c8c;

      &:last-of-type {
        color: #000a28;
      }
    }
  }
`;
