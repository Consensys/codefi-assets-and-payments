import styled from 'styled-components';

import { spacing, typography } from 'constants/styles';

const StyledLabel = styled.label`
  display: flex;
  padding: ${spacing.small} 0 ${spacing.xs};
  margin-bottom: ${spacing.small};
  font-size: ${typography.sizeF1};
  font-weight: ${typography.weightMedium};
  align-items: center;

  > span {
    margin-left: 2px;

    &.required-asterisk {
      color: red;
      font-weight: ${typography.weightBold};
    }

    &.optional {
      color: #777c8c;
      font-weight: normal;
    }
  }
`;

export default StyledLabel;
