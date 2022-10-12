import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const StyledDataTable = styled.div`
  overflow: auto;

  > table {
    width: 100%;

    > thead {
      > tr {
        > td {
          vertical-align: middle;
          font-size: ${typography.sizeF1};
          font-weight: ${typography.weightBold};

          &:last-of-type {
            border-right: none;
          }

          > div {
            display: flex;
            align-items: center;
            padding: ${spacing.small} ${spacing.tight};
            color: #444;

            > div {
              flex-grow: 1;
              display: flex;
              align-items: center;
            }

            > button {
              border: none;
              background: none;
              display: inline-block;
              vertical-align: middle;
              margin-right: 5px;

              > svg {
                width: 15px;
                display: block;
              }
            }
          }
        }
      }
    }

    > tbody {
      color: #444;
      > tr {
        &:hover {
          background-color: #f6f6f6;
        }
        > td {
          border-top: 1px solid #ccc;
          padding: ${spacing.small} ${spacing.tight};
          height: ${typography.sizeF6};
          vertical-align: middle;
          font-size: ${typography.sizeF1};
          max-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &:last-of-type {
            border-right: none;
          }

          &.noCrop {
            max-width: initial;
          }

          > a {
            color: ${colors.main};
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }

  > footer {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    position: sticky;
    left: 0;
  }
`;

export default StyledDataTable;
