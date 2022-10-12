import styled from 'styled-components';

import { spacing, typography } from 'constants/styles';

const StyledClientCreation = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);

  > form {
    padding: ${spacing.tight} ${spacing.tight};
    margin: 15px auto;
    max-width: 600px;
    width: 100%;
    > div {
      > label {
        margin-bottom: 0px;
      }

      > div {
        margin-bottom: ${spacing.tight};
      }
    }

    > h2 {
      font-size: ${typography.sizeF4};
      font-weight: ${typography.weightMedium};
      margin: ${spacing.tightLooser} 0 0 0;
    }

    > p {
      font-size: ${typography.sizeF2};
      color: #757c8c;
    }

    > .client-title {
      margin-bottom: ${spacing.tight};
    }

    > .select-client-type {
      width: 80%;
    }

    > .admin-name {
      display: flex;
      > div {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
        > div {
          max-width: 290px;
          width: 48%;
        }
      }
    }

    > footer {
      margin: 32px auto;
      width: 100%;
      display: flex;
    }
  }
`;

export default StyledClientCreation;
