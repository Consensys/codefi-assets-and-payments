import styled from 'styled-components';

import { colors, spacing, typography } from 'constants/styles';

const StyledAutosaveIndicator = styled.div`
  font-size: ${typography.sizeF1};
  display: flex;
  align-items: center;

  > div > svg {
    margin-right: ${spacing.xs};
    vertical-align: bottom;
    display: inline-block;
  }

  &.saved {
    > div {
      display: inline-block;
      border-radius: 4px;
      padding: ${spacing.xs} ${spacing.small};
      background-color: ${colors.successLighter};
      color: ${colors.successDark};
    }
  }

  &.saving {
    > .loader {
      width: auto;
      margin-right: ${spacing.xs};
    }
  }

  &.error {
    > div {
      display: inline-block;
      border-radius: 4px;
      padding: ${spacing.xs} ${spacing.small};
      background-color: ${colors.errorLighter};
      color: ${colors.errorDark};

      > button {
        display: inline-block;
        margin-left: ${spacing.small};
        color: ${colors.main};
        font-weight: ${typography.weightMedium};
        border: none;
        background: none;
      }
    }
  }
`;

export default StyledAutosaveIndicator;
