import { spacing, typography } from 'constants/styles';
import styled from 'styled-components';

const TEST_ID = 'assetData';
export const AssetData = styled.div.attrs({
  'data-test-id': TEST_ID,
})`
  font-weight: ${typography.weightMedium};
  background: #f6f6f6;
  padding: ${spacing.small} ${spacing.tight};
  display: flex;

  > div {
    display: flex;
    flex-direction: column;

    > span {
      font-weight: normal;
      font-size: ${typography.sizeF1};
      color: #777c8c;
    }

    > div {
      display: flex;
      align-items: center;
    }
  }
`;

export const AssetStatus = styled.div`
  text-transform: capitalize;
  margin-right: ${spacing.small};
  padding: 0 ${spacing.small};
  border-right: 1px solid #dfe0e6;
`;
