import styled from 'styled-components';

import { colors } from 'constants/styles';

const StyledTimeSeriesLargeGraph = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  display: block;

  &.isLoading {
    padding: 30px;
  }

  > header {
    padding: 20px 24px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-direction: column;

    @media (min-width: 800px) {
      flex-direction: row;
    }

    > menu {
      padding-top: 15px;

      @media (min-width: 800px) {
        padding-top: 0;
      }

      > button {
        color: #777;
        margin-left: 20px;
        font-weight: 600;
        font-size: 14px;
        background: none;
        border: none;

        &:first-of-type {
          margin-left: 0;
        }

        &::after {
          content: '';
          display: block;
          width: 100%;
          height: 2px;
          background-color: ${colors.main};
          margin-top: 2px;
          opacity: 0;
          transform: translateY(5px);
          transition: opacity 200ms ease-out, transform 200ms ease-out;
        }

        &.active,
        &:hover {
          color: ${colors.main};

          &::after {
            opacity: 1;
            transform: translateY(0);
          }
        }
      }
    }
  }

  > .graphContainer {
    overflow: hidden;
    position: relative;

    > svg {
      display: block;
      fill: none;
      stroke-linecap: round;
      stroke-width: 2px;
      stroke-linejoin: round;
      stroke: ${colors.main};
    }

    > .overlay {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;

      > div {
        height: 100%;
        flex-shrink: 0;
        position: absolute;
        top: 0;
        cursor: pointer;
        transition: background-color 200ms ease-out;

        &:hover {
          > .bar {
            opacity: 1;
            transform: translateY(0);
          }

          > .dot {
            transform: scale(1);
          }
        }

        > .dot {
          position: absolute;
          top: 10px;
          left: 50%;
          height: 10px;
          width: 10px;
          margin-left: -5px;
          background-color: ${colors.main};
          border-radius: 100px;
          transform: scale(0);
          transition: transform 200ms ease-out;
        }

        > .bar {
          pointer-events: none;
          opacity: 0;
          transition: opacity 200ms ease-out, transform 300ms ease-out;
          transform: translateY(30px);
          position: absolute;
          top: 50%;
          margin-top: -30px;
          background: #000a28;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          color: #fff;
          border-radius: 4px;
          padding: 8px 16px;
          left: 20px;

          &.right {
            left: auto;
            right: 20px;
          }

          // &::after {
          //   content: '';
          //   display: block;
          //   width: 0;
          //   height: 0;
          //   border: 8px solid transparent;
          //   position: absolute;
          //   top: 50%;
          //   border-right-color: #000a28;
          //   left: -16px;
          //   margin-top: -8px;
          // }

          > span {
            display: block;
            font-weight: 600;

            &:last-of-type {
              font-size: 12px;
              font-weight: normal;
            }
          }
        }
      }
    }
  }

  > footer {
    border-top: 1px solid #eee;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-around;

    > span {
      color: #777;
      display: block;
    }
  }
`;
export default StyledTimeSeriesLargeGraph;
