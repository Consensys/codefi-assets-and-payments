import styled from 'styled-components';

import { thresholdMobile, spacing, colors, typography } from 'constants/styles';

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;

  @media screen and (min-width: ${thresholdMobile}) {
    flex-direction: row;
  }

  > aside {
    background-color: ${colors.sidebarBackground};
    display: block;
    flex-shrink: 0;
    height: ${spacing.loose};
    position: relative;
    width: 100%;
    z-index: 10;
    box-shadow: inset -2px 0px 4px rgb(0 0 0 / 10%);

    @media screen and (min-width: ${thresholdMobile}) {
      border-bottom: none;
      height: 100vh;
      width: ${spacing.xl};

      &.minified {
        width: 80px;
      }
    }

    > header {
      align-items: center;
      display: flex;
      height: ${spacing.loose};
      justify-content: space-between;
      margin-top: 15px;

      @media screen and (min-width: ${thresholdMobile}) {
        height: 120px;
      }

      > button {
        align-items: center;
        background: none;
        border: none;
        display: flex;
        height: 100%;
        justify-content: center;
        padding: 15px;
        color: ${colors.mainLight};
        font-size: 12px;
        font-weight: bold;

        > svg,
        > img {
          display: block;
        }

        > span {
          display: block;
          margin-left: 5px;
        }

        @media screen and (min-width: ${thresholdMobile}) {
          display: none;
        }
      }

      > svg,
      > img {
        display: block;
        margin: 0 20px;
        width: 50px;
        max-height: 100px;

        &.desktop {
          display: none;
          max-height: 100px;
          width: 100% !important;
          padding-left: 30px;
          padding-right: 30px;
        }

        &.mobile {
          display: block;
        }

        @media screen and (min-width: ${thresholdMobile}) {
          margin: auto;
          width: auto;

          &.desktop {
            display: block;
          }

          &.desktop.minified {
            display: none;
          }

          &.mobile {
            display: none;
          }

          &.mobile.minified {
            display: block;
            width: 50px;
          }
        }
      }
    }

    > .workspace {
      height: ${spacing.regular};
      justify-content: space-around;
      margin: ${spacing.small};
      display: none;
      > span {
        color: #f0f0f2;
        line-height: ${spacing.tightLooser};
        font-weight: ${typography.weightLightMedium};
        font-size: ${typography.sizeF1};
        margin-left: ${spacing.tightLooser};
      }

      &.minified {
        opacity: 0;
      }
      @media screen and (min-width: ${thresholdMobile}) {
        border-bottom: 1px solid #475166;
        // display: block;
      }
    }

    > button {
      position: absolute;
      top: 5%;
      right: -14px;
      margin-top: -20px;
      width: 24px;
      height: 24px;
      background: #f6f6f6;
      border: 1px solid #ccc;
      border-radius: 100px;
      align-items: center;
      justify-content: center;
      display: none;

      @media screen and (min-width: ${thresholdMobile}) {
        display: flex;
      }

      > svg {
        display: block;
      }
    }

    > menu {
      position: absolute;
      top: ${spacing.loose};
      display: none;
      color: ${colors.sidebarText};
      height: auto;
      overflow-y: auto;
      width: 100%;
      flex-direction: column;
      align-items: center;
      padding-bottom: 16px;

      &.opened {
        display: flex;

        background-color: ${colors.sidebarBackground};
      }

      @media screen and (min-width: ${thresholdMobile}) {
        padding-bottom: 0;
        height: calc(100vh - ${spacing.large} - ${spacing.regular});
        top: 0;
        border-right: none;
        display: flex;
        align-items: stretch;
        position: static;
      }

      > h3 {
        text-transform: uppercase;
        font-size: 12px;
        color: #666;
        font-weight: bold;
        padding: 5px 20px;
        margin: 50px 0 20px 0;
      }

      > div {
        padding: 0 16px;
        width: 100%;

        &.mobileSpecificFields {
          display: block;

          @media screen and (min-width: ${thresholdMobile}) {
            display: none;
          }
        }

        > a,
        div {
          margin: 5px 0;
          height: 40px;
          display: flex;
          align-items: center;
          font-size: ${typography.sizeF1};
          color: ${colors.sidebarText};
          text-decoration: none;
          transition: color 200ms ease-out, background-color 200ms ease-out;
          border-radius: 4px;
          padding: 0 14px;
          background-color: transparent;
          width: 100%;

          > svg {
            transition: fill 200ms ease-out;
            display: block;
            margin-right: 18px;
            flex-shrink: 0;
          }

          @media screen and (min-width: ${thresholdMobile}) {
            &.minified {
              justify-content: center;

              > span {
                display: none;
              }

              > svg {
                margin: 0;
              }
            }
          }

          &:hover,
          &.active {
            color: ${colors.sidebarTextHover};
            background-color: ${colors.sidebarBackgroundHover};

            > svg {
              fill: ${colors.sidebarTextHover} !important;
            }
          }
        }
      }

      > .spacer {
        flex-grow: 1;
      }

      > hr {
        width: 100%;
        height: 1px;
        border: none;
        background-color: #fff9;
        margin: 10px 0;

        @media screen and (min-width: ${thresholdMobile}) {
          display: none;
        }
      }
    }
  }

  > main {
    overflow-x: hidden;
    display: block;
    flex-grow: 1;
    height: calc(100vh - ${spacing.loose});
    width: 100%;

    @media screen and (min-width: ${thresholdMobile}) {
      width: calc(100vw - ${spacing.xl});
      height: 100vh;
    }
  }
`;

export default StyledLayout;
