import styled from 'styled-components';
import { colors } from 'constants/styles';

const StyledPaginatedDataListCard = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin: 20px 0;
  width: 100%;

  @media (max-width: 1050px) {
    padding: 10px;
  }

  > header {
    padding: 24px;
    display: flex;
    flex-direction: column;

    @media (min-width: 1050px) {
      align-items: center;
      justify-content: space-between;
      flex-direction: row;
    }

    > h2 {
      font-weight: 600;
      font-size: 16px;
      color: #444;
    }

    > a {
      display: flex;
      align-items: center;
      font-weight: 500;
      font-size: 14px;
      color: ${colors.main};
      text-decoration: none;

      > svg {
        margin-left: 15px;
      }
    }
  }

  > .emptyState {
    height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    > h2 {
      font-size: var(--typography-size-f3);
      font-weight: var(--typography-weight-medium);
      margin: var(--spacing-tight-looser) 0;
    }

    > p {
      margin-bottom: var(--spacing-tight-looser);
      color: #444;
    }
  }

  > .filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    border-bottom: 1px solid #eee;
    margin-bottom: 20px;
    padding: 0 24px 24px 24px;

    > .filterSelect {
      margin: 0 12px 12px 0;
    }
  }

  > footer {
    padding: 0 24px 24px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;

    @media (min-width: 1050px) {
      flex-direction: row;
    }

    > .selectRowsPerPage {
      display: flex;
      align-items: center;

      > span {
        margin-right: 10px;
        font-size: 12px;
        color: #777c8c;
      }
    }
  }

  > table {
    width: 100%;
    padding: 0 24px 24px 24px;

    > thead {
      display: none;

      > tr {
        > td {
          font-weight: 600;
          font-size: 14px;
          padding: 8px 16px;
          border-bottom: 1px solid #ddd;
        }
      }

      @media (min-width: 1050px) {
        display: table-header-group;
      }
    }

    > tbody {
      > tr {
        margin-bottom: 40px;
        display: block;
        border-bottom: 2px solid #666;
        transition: background-color 200ms ease-out;

        &:hover {
          background-color: #f6f6f6;

          > td .hidden {
            opacity: 1;
          }
        }

        &:last-of-type {
          margin-bottom: 0;
        }

        @media (min-width: 1050px) {
          margin-bottom: 0;
          border-bottom: none;
          display: table-row;
        }

        > td {
          display: block;
          width: 100%;
          color: #444;
          font-size: 14px;
          padding: 12px 0;
          border-bottom: 1px solid #ddd;

          .hidden {
            opacity: 1;
            transition: opacity 200ms ease-out;
          }

          @media (min-width: 1050px) {
            width: auto;
            padding: 12px 16px;
            vertical-align: middle;
            display: table-cell;

            .hidden {
              display: flex;
              opacity: 0;
              float: right;
              > a {
                color: ${colors.main};
              }
            }
          }

          > div {
            display: flex;
            align-items: center;
            justify-content: space-between;

            @media (min-width: 1050px) {
              display: inline;
            }

            > div:first-of-type {
              color: #000;
              font-weight: 600;

              @media (min-width: 1050px) {
                display: none;
              }
            }
          }
        }
      }
    }
  }
`;

export default StyledPaginatedDataListCard;
