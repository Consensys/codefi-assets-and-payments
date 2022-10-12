import styled from 'styled-components';

import { thresholdMobile, spacing, colors, typography } from 'constants/styles';

const StyledLayout: React.FC<any> = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 870px;
  box-shadow: 0px 4px 4px 0px #00000040;
  margin: auto;

  @media screen and (min-width: ${thresholdMobile}) {
    flex-direction: row;
  }

  > aside {
    background-color: ${(props: any) =>
      props.colorSidebarBackground || colors.sidebarBackground};
    display: block;
    flex-shrink: 0;
    height: ${spacing.xs};
    position: relative;
    width: 100%;
    z-index: 9;

    @media screen and (min-width: 600px) {
      border-bottom: none;
      height: 600px;
      width: 220px;

      &.minified {
        width: 80px;
      }
    }

    > header {
      align-items: center;
      display: flex;
      height: ${spacing.loose};
      justify-content: space-between;

      @media screen and (min-width: 600px) {
        height: 30px;
      }
      > div > img {
        max-height: 75px;
      }
      > button {
        align-items: center;
        background: none;
        border: none;
        display: flex;
        height: 600px;
        justify-content: center;
        padding: 15px;
        color: ${(props: any) => props.colorMain || colors.main};
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

        @media screen and (min-width: 600px) {
          display: none;
        }
      }

      > svg,
      > img {
        display: block;
        margin: 0 20px;
        width: 50px;
        max-height: 50px;
        max-width: 110px;

        &.desktop {
          display: none;
        }

        &.mobile {
          display: block;
        }

        @media screen and (min-width: 600px) {
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
      @media screen and (min-width: 600px) {
        border-bottom: 1px solid #475166;
        // display: block;
      }
    }

    > menu {
      background-color: ${(props: any) =>
        props.colorSidebarBackground || colors.sidebarBackground};
      position: absolute;
      top: ${spacing.loose};
      display: none;
      color: ${(props: any) => props.colorSidebarText || colors.sidebarText};
      height: auto;
      overflow-y: auto;
      width: 100%;
      flex-direction: column;
      align-items: center;
      padding-bottom: 16px;

      > button {
        position: absolute;
        top: 50%;
        right: -16px;
        margin-top: -16px;
        width: 32px;
        height: 32px;
        background: #f6f6f6;
        border: 1px solid #ccc;
        border-radius: 100px;
        align-items: center;
        justify-content: center;
        display: none;

        @media screen and (min-width: 600px) {
          display: flex;
        }

        > svg {
          display: block;
        }
      }

      &.opened {
        display: flex;
      }

      @media screen and (min-width: 600px) {
        padding-bottom: 0;
        height: 300px;
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

          @media screen and (min-width: 600px) {
            display: none;
          }
        }

        > a {
          margin: 5px 0;
          height: 40px;
          display: flex;
          align-items: center;
          font-size: ${typography.sizeF1};
          color: ${(props: any) =>
            props.colorSidebarText || colors.sidebarText};
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

          @media screen and (min-width: 600px) {
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
            color: ${(props: any) =>
              props.colorSidebarTextHover || colors.sidebarTextHover};
            background-color: ${(props: any) =>
              props.colorSidebarBackgroundHover ||
              colors.sidebarBackgroundHover};

            > svg {
              fill: ${(props: any) =>
                props.colorSidebarTextHover ||
                colors.sidebarTextHover} !important;
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

        @media screen and (min-width: 600px) {
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

    @media screen and (min-width: 600px) {
      width: calc(100vw - ${spacing.xl});
      height: 100vh;
    }
  }
`;

export default StyledLayout;
