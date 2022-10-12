import styled from 'styled-components';

import { colors, spacing, thresholdMobile } from 'constants/styles';

const TEST_ID = 'topBar';

const StyledTopBar = styled.div.attrs({
  'data-test-id': TEST_ID,
})`
  height: ${spacing.loose};
  display: none;
  align-items: center;
  justify-content: flex-end;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding-right: 10px;
  z-index: 9;
  position: relative;
  position: sticky;
  top: 0;
  background: white;
  @media screen and (min-width: ${thresholdMobile}) {
    display: flex;
  }
  > div {
    cursor: pointer;
  }
  > a,
  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;

    > svg {
      display: block;
    }

    &:hover {
      > svg {
        fill: ${colors.main} !important;
      }
    }

    .dropdown-content {
      margin-top: 65px;
    }
  }
`;

export default StyledTopBar;
