import { spacing, typography, colors } from 'constants/styles';
import styled from 'styled-components';

export const OrderTotal = styled.div`
  padding: ${spacing.tight};
  margin: 0;

  > p,
  > h2 {
    color: #000a28;
    font-size: ${typography.sizeF3};
    font-weight: ${typography.weightMedium};
    margin: 0;
    display: flex;
  }

  > span,
  > p > span {
    display: flex;
    align-items: center;
    font-weight: ${typography.weightNormal};
    color: ${colors.main};
    font-size: ${typography.sizeF1};
  }
`;

export const OrderSubtotal = styled.p`
  color: #475166;
  font-size: ${typography.sizeF1};
  padding: 0 ${spacing.tight};
`;
