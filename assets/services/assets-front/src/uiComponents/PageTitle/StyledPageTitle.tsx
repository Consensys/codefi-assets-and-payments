import styled from 'styled-components';

import { spacing, colors, typography } from 'constants/styles';

const StyledPageTitle = styled.div`
  margin: ${spacing.tight} ${spacing.regular} 0 ${spacing.regular};
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 2px solid #ddd;
  flex-wrap: wrap;

  &.hasTabNavigation {
    padding-bottom: 0;
  }

  @media screen and (min-width: 1000px) {
    padding: 0 0 ${spacing.tight} 0;
  }

  > div:first-of-type {
    > .backlink {
      display: flex;
      align-items: center;
      color: ${colors.main};
      text-decoration: none;

      > svg {
        display: block;
        margin-right: ${spacing.xs};
      }

      > span {
        position: relative;
        display: block;

        &::after {
          content: '';
          background: ${colors.main};
          height: 2px;
          width: 100%;
          display: block;
          bottom: 0;
          right: 0;
          transform: translateY(5px);
          opacity: 0;
          transition: opacity 200ms ease-out, transform 200ms ease-out;
        }
      }

      &:hover {
        > svg {
          transform: translateX(-5px);
        }

        > span::after {
          transform: translateY(0);
          opacity: 1;
        }
      }
    }

    > .title {
      font-size: ${typography.sizeF4};
      font-weight: ${typography.weightMedium};
      display: block;

      @media screen and (min-width: 1000px) {
        font-size: ${typography.sizeF5};
      }
    }
  }

  > div.tabActions {
    display: flex;
    align-items: center;

    > button:not(:first-child),
    > a:not(:first-child) {
      margin-left: 5px;
    }
  }

  > div.tabNavigation {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-top: 10px;
    flex-direction: column-reverse;

    @media screen and (min-width: 1000px) {
      align-items: flex-end;
      flex-direction: row;
    }

    > div:first-of-type {
      display: flex;
      align-items: center;

      > a {
        display: block;
        margin-right: 32px;
        font-weight: 600;
        font-size: 14px;
        color: #777;
        text-decoration: none;
        border-bottom: 2px solid transparent;
        padding-bottom: 10px;
        transform: translateY(2px);
        transition: color 200ms ease-out, border-bottom-color 200ms ease-out;

        &.active,
        &:hover {
          color: ${colors.main};
          border-bottom-color: ${colors.main};
        }
      }
    }
  }
`;

export default StyledPageTitle;
