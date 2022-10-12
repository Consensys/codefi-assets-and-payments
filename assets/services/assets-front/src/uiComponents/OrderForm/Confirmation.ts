import { colors, spacing } from 'constants/styles';
import styled from 'styled-components';

const TEST_ID = 'confirmOrder';
export const Confirmation = styled.div.attrs({
  'data-test-id': TEST_ID,
})`
  display: flex;
  align-items: center;
  padding: 24px;
  border-radius: 4px;
  background-color: ${colors.successLighter};
  border: 1px solid ${colors.successLight};
  margin-bottom: ${spacing.regular};

  > svg {
    display: block;
    margin-right: 10px;
  }

  > span {
    display: block;
    color: #000a28;
  }
`;

export const ConfirmationActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${spacing.tight} 0;

  > a {
    margin-bottom: 16px;
  }
`;

export const ConfirmationText = styled.div`
  width: 516px;
  fonts-size: 16px;
  line-height: 1.5;
  color: #4a4a4a;
`;

export const PlaceOrderConfirmation = styled.div`
  width: 516px;
  font-size: 16px;
  line-height: 24px;
  color: #19191;
  margin-bottom: ${spacing.tightLooser};
`;

export const PlaceOrderInformation = styled.div`
  width: 516px;
  font-size: 14px;
  line-height: 24px;
  color: #475166;
`;
